#include "KafkaHandler.h"
#include "MatchingEngine.h"
#include "Order.h"
#include <iostream>

int main() {
    MatchingEngine engine;

    // Consume only ME_IN for now
    KafkaHandler kafka("localhost:9092", "ME_IN");

    kafka.consumeMessages([&](const nlohmann::json& msg) {

        // Ignore non-order messages
        if (msg["messageType"] != "ORDER_SUBMIT") return;

        Order order;
        order.orderId = msg["payload"]["orderId"];
        order.userId  = msg["payload"]["userId"];
        order.symbol  = msg["payload"]["symbol"];
        order.side    = msg["payload"]["side"] == "BUY"
                            ? OrderSide::BUY
                            : OrderSide::SELL;
        order.price   = msg["payload"]["price"];
        order.size    = msg["payload"]["size"];
        order.remainingSize = order.size;
        order.status  = OrderStatus::NEW;
        order.timestamp = std::chrono::system_clock::now();

        // Submit order to matching engine
        auto trades = engine.submitOrder(order);

        // FOR NOW: just print trades to console
        // Later this will go to ME_OUT
        for (auto& t : trades) {
            std::cout << "Trade executed: "
                      << t.tradeId << " "
                      << t.symbol << " "
                      << t.quantity << " @ " << t.price
                      << " BUY:" << t.buyOrderId
                      << " SELL:" << t.sellOrderId << std::endl;
        }

        // 🚫 DO NOT PRODUCE TO ME_OUT YET
        // This will be added in next step
    });

    return 0;
}
