#ifndef MATCHING_ENGINE_H
#define MATCHING_ENGINE_H

#include "OrderBook.h"
#include "Order.h"
#include "Trade.h"

#include <map>
#include <memory>
#include <vector>

class MatchingEngine {
private:
    std::map<std::string, std::unique_ptr<OrderBook>> orderBooks;

public:
    MatchingEngine();

    std::vector<Trade> submit(const Order& order);

    bool cancel(const std::string& userId, const std::string& orderId, Order& cancelledOut);
    bool modify(const std::string& userId, const std::string& orderId, double newSize, double newPrice, Order& modifiedOut);

    std::vector<Order> queryOrders(
        const std::string& requesterUserId,
        bool ownOnly,
        const std::string& symbolFilter,
        const std::string& sideFilter
    );
};

#endif
