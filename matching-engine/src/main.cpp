#include "KafkaHandler.h"
#include "MatchingEngine.h"
#include "Order.h"
#include <iostream>

static std::string statusToStr(OrderStatus s) {
    switch (s) {
        case OrderStatus::NEW: return "NEW";
        case OrderStatus::PENDING: return "PENDING";
        case OrderStatus::PARTIALLY_FILLED: return "PARTIALLY_FILLED";
        case OrderStatus::FILLED: return "FILLED";
        case OrderStatus::CANCELLED: return "CANCELLED";
        case OrderStatus::REJECTED: return "REJECTED";
        default: return "UNKNOWN";
    }
}

static bool validOrderBasic(const Order& o, std::string& why) {
    if (o.orderId.empty() || o.userId.empty() || o.symbol.empty()) { why = "Missing fields"; return false; }
    if (o.price <= 0 || o.size <= 0) { why = "Invalid price/size"; return false; }
    return true;
}

int main() {
    MatchingEngine engine;
    KafkaHandler kafka("localhost:9092");

    std::cout << "Matching Engine consuming ME_IN...\n";

    kafka.consume("ME_IN", [&](const ConsumedMessageInfo& m) {
        const json& msg = m.data;

        std::string messageType = msg.value("messageType", "");
        std::string requestId   = msg.value("requestId", "");

        if (messageType.empty() || requestId.empty()) return;

        //order submt
        if (messageType == "ORDER_SUBMIT") {
            Order o;
            auto p = msg["payload"];

            o.orderId = p.value("orderId", "");
            o.userId  = p.value("userId", "");
            o.symbol  = p.value("symbol", "");
            std::string sideStr = p.value("side", "BUY");
            o.side    = (sideStr == "BUY") ? OrderSide::BUY : OrderSide::SELL;
            o.price   = p.value("price", 0.0);
            o.size    = p.value("size", 0.0);
            o.remainingSize = o.size;
            o.status  = OrderStatus::NEW;
            o.timestamp = std::chrono::system_clock::now();

            std::string why;
            if (!validOrderBasic(o, why)) {
                json resp = {
                    {"messageType", "ORDER_SUBMIT_RESPONSE"},
                    {"requestId", requestId},
                    {"status", "ERROR"},
                    {"error", why},
                    {"payload", json::object()}
                };
                kafka.produce("ME_OUT", requestId, resp);
                return;
            }

            auto trades = engine.submit(o);

            
            double filledQty = 0.0;
            for (auto& t : trades) {
                if (t.buyOrderId == o.orderId || t.sellOrderId == o.orderId)
                    filledQty += t.quantity;
            }
            double remainingQty = std::max(0.0, o.size - filledQty);

            std::string orderStatus = (remainingQty <= 0.0001) ? "FILLED" : (filledQty > 0 ? "PARTIALLY_FILLED" : "PENDING");

            json tradesArr = json::array();
            for (auto& t : trades) {
                tradesArr.push_back({
                    {"tradeId", t.tradeId},
                    {"symbol", t.symbol},
                    {"price", t.price},
                    {"quantity", t.quantity},
                    {"buyOrderId", t.buyOrderId},
                    {"sellOrderId", t.sellOrderId},
                    {"buyUserId", t.buyUserId},
                    {"sellUserId", t.sellUserId},
                    {"timestampMs", (long long)std::chrono::duration_cast<std::chrono::milliseconds>(
                        t.timestamp.time_since_epoch()).count()}
                });
            }

            json resp = {
                {"messageType", "ORDER_SUBMIT_RESPONSE"},
                {"requestId", requestId},
                {"status", "SUCCESS"},
                {"payload", {
                    {"orderId", o.orderId},
                    {"symbol", o.symbol},
                    {"side", sideStr},
                    {"price", o.price},
                    {"size", o.size},
                    {"status", orderStatus},
                    {"filledQuantity", filledQty},
                    {"remainingQuantity", remainingQty},
                    {"trades", tradesArr}
                }}
            };

            kafka.produce("ME_OUT", resp);
            return;
        }

        // order cancel
        if (messageType == "ORDER_CANCEL") {
            auto p = msg["payload"];
            std::string userId = p.value("userId", "");
            std::string orderId = p.value("orderId", "");

            Order cancelled;
            bool ok = engine.cancel(userId, orderId, cancelled);

            json resp = {
                {"messageType", "ORDER_CANCEL_RESPONSE"},
                {"requestId", requestId},
                {"status", ok ? "SUCCESS" : "ERROR"},
                {"payload", ok ? json{{"orderId", orderId}, {"status", "CANCELLED"}} : json::object()},
                {"error", ok ? "" : "Cancel failed (not found / not owner)"}
            };
            kafka.produce("ME_OUT", resp);
            return;
        }

        // order modify
        if (messageType == "ORDER_MODIFY") {
            auto p = msg["payload"];
            std::string userId = p.value("userId", "");
            std::string orderId = p.value("orderId", "");
            double newSize = p.value("newSize", 0.0);
            double newPrice = p.value("newPrice", 0.0);

            Order modified;
            bool ok = engine.modify(userId, orderId, newSize, newPrice, modified);

            json resp = {
                {"messageType", "ORDER_MODIFY_RESPONSE"},
                {"requestId", requestId},
                {"status", ok ? "SUCCESS" : "ERROR"},
                {"payload", ok ? json{
                    {"orderId", orderId},
                    {"symbol", modified.symbol},
                    {"side", (modified.side == OrderSide::BUY ? "BUY" : "SELL")},
                    {"price", modified.price},
                    {"size", modified.size},
                    {"status", "PENDING"}
                } : json::object()},
                {"error", ok ? "" : "Modify failed (not found / not owner)"}
            };
            kafka.produce("ME_OUT", resp);
            return;
        }

        // query orders handle
        if (messageType == "QUERY_ORDERS") {
            auto p = msg["payload"];
            std::string userId = p.value("userId", "");
            bool ownOnly = p.value("ownOnly", true);
            std::string symbol = p.value("symbol", "");
            std::string side   = p.value("side", "");

            auto orders = engine.queryOrders(userId, ownOnly, symbol, side);

            json arr = json::array();
            for (auto& o : orders) {
                arr.push_back({
                    {"orderId", o.orderId},
                    {"userId", o.userId},
                    {"symbol", o.symbol},
                    {"side", (o.side == OrderSide::BUY ? "BUY" : "SELL")},
                    {"price", o.price},
                    {"size", o.size},
                    {"remainingSize", o.remainingSize},
                    {"status", statusToStr(o.status)}
                });
            }

            json resp = {
                {"messageType", "QUERY_ORDERS_RESPONSE"},
                {"requestId", requestId},
                {"status", "SUCCESS"},
                {"payload", {{"orders", arr}}}
            };
            kafka.produce("ME_OUT", resp);
            return;
        }

   
        json resp = {
            {"messageType", messageType + std::string("_RESPONSE")},
            {"requestId", requestId},
            {"status", "ERROR"},
            {"error", "Unsupported messageType"},
            {"payload", json::object()}
        };
        kafka.produce("ME_OUT", resp);
    });

    return 0;
}
