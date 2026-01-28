#include "MatchingEngine.h"

MatchingEngine::MatchingEngine() {}

OrderBook& MatchingEngine::getBook(const std::string& symbol) {
    auto it = books.find(symbol);
    if (it == books.end()) {
        books[symbol] = std::make_unique<OrderBook>(symbol);
    }
    return *books[symbol];
}

std::vector<Trade> MatchingEngine::submit(const Order& order) {
    orderHistory.push_back(order);
    orderIdToSymbol[order.orderId] = order.symbol;

    auto trades = getBook(order.symbol).addOrder(order);

    for (auto& t : trades) tradeHistory.push_back(t);
    return trades;
}

bool MatchingEngine::cancel(const std::string& orderId) {
    auto it = orderIdToSymbol.find(orderId);
    if (it == orderIdToSymbol.end()) return false;

    const std::string& symbol = it->second;
    auto bk = books.find(symbol);
    if (bk == books.end()) return false;

    bool ok = bk->second->cancelOrder(orderId);
    if (ok) orderIdToSymbol.erase(it);
    return ok;
}
