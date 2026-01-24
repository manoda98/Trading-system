#include "MatchingEngine.h"

MatchingEngine::MatchingEngine() {}

std::vector<Trade> MatchingEngine::submitOrder(const Order& order) {
    if (orderBooks.find(order.symbol) == orderBooks.end()) {
        orderBooks[order.symbol] = std::make_unique<OrderBook>(order.symbol);
    }

    return orderBooks[order.symbol]->addOrder(order);
}
