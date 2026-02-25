#include "MatchingEngine.h"

MatchingEngine::MatchingEngine() {}

std::vector<Trade> MatchingEngine::submit(const Order& order) {
    if (!orderBooks.count(order.symbol)) {
        orderBooks[order.symbol] = std::make_unique<OrderBook>(order.symbol);
    }
    auto trades = orderBooks[order.symbol]->addOrder(order);

    for (const auto& t : trades) {
        tradeHistory.push_back(t);
    }
    return trades;
}

bool MatchingEngine::cancel(const std::string& userId, const std::string& orderId, Order& cancelledOut) {
    for (auto& [sym, book] : orderBooks) {
        Order found;
        if (book->cancelOrder(orderId, found)) {
            
            if (found.userId != userId) {
                book->addOrder(found);
                return false;
            }
            cancelledOut = found;
            cancelledOut.status = OrderStatus::CANCELLED;
            return true;
        }
    }
    return false;
}

bool MatchingEngine::modify(
    const std::string& userId,
    const std::string& orderId,
    double newSize,
    double newPrice,
    Order& modifiedOut
) {
    for (auto& [sym, book] : orderBooks) {
        Order found;
        if (book->modifyOrder(orderId, newSize, newPrice, found)) {
            if (found.userId != userId) {
                return false;
            }
            modifiedOut = found;
            return true;
        }
    }
    return false;
}

std::vector<Order> MatchingEngine::queryOrders(
    const std::string& requesterUserId,
    bool ownOnly,
    const std::string& symbolFilter,
    const std::string& sideFilter
) {
    std::vector<Order> out;

    for (auto& [sym, book] : orderBooks) {
        if (!symbolFilter.empty() && sym != symbolFilter) continue;

        auto chunk = book->getOpenOrdersFiltered(requesterUserId, ownOnly, sideFilter, symbolFilter);
        out.insert(out.end(), chunk.begin(), chunk.end());
    }

    return out;
}

std::vector<Trade> MatchingEngine::queryTrades(
    const std::string& userId,
    const std::string& symbolFilter
) const {
    std::vector<Trade> out;
    out.reserve(tradeHistory.size());

    for (const auto& t : tradeHistory) {
        bool isMine = (t.buyUserId == userId || t.sellUserId == userId);
        if (!isMine) continue;

        if (!symbolFilter.empty() && t.symbol != symbolFilter) continue;

        out.push_back(t);
    }
    return out;
}
