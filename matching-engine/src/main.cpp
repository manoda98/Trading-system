#include "KafkaHandler.h"
#include "MatchingEngine.h"
#include "Order.h"
#include <iostream>

static bool validOrderBasic(const Order& o, std::string& why) {
    if (o.orderId.empty() || o.userId.empty() || o.symbol.empty()) { why = "Missing fields"; return false; }
    if (o.price <= 0 || o.size <= 0) { why = "Invalid price/size"; return false; }
    return true;
}

int main() {
    MatchingEngine engine;
    KafkaHandler kafka("localhost:9092");

    kafka.consume("ME_IN", [&](const ConsumedMessageInfo& m) {
        const json& msg = m.data;

        std::string messageType = msg.value("messageType", "");
        std::string requestId   = msg.value("requestId", "");

        if (messageType.empty() || requestId.empty()) return;

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
                kafka.produce("ME_OUT", resp);
                return;
            }

            auto trades = engine.submit(o);

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
                    {"trades", tradesArr}
                }}
            };

            kafka.produce("ME_OUT", resp);
            return;
        }

    });

    return 0;
}
