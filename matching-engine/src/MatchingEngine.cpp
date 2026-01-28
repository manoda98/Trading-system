#include "MatchingEngine.h"

MatchingEngine::MatchingEngine() {}

std::vector<Trade> MatchingEngine::submit(const Order& order) {
    if (!orderBooks.count(order.symbol)) {
        orderBooks[order.symbol] = std::make_unique<OrderBook>(order.symbol);
    }
    return orderBooks[order.symbol]->addOrder(order);
}

bool MatchingEngine::cancel(const std::string& userId, const std::string& orderId, Order& cancelledOut) {
    for (auto& [sym, book] : orderBooks) {
        Order found;
        if (book->cancelOrder(orderId, found)) {
            
            if (found.userId != userId) {
                // not allowed -> reinsert back (best effort)
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
