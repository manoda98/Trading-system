#ifndef ORDER_BOOK_H
#define ORDER_BOOK_H

#include "Order.h"
#include "Trade.h"

#include <map>
#include <deque>
#include <string>
#include <vector>
#include <functional>

class OrderBook {
private:
    std::string symbol;

    // BUY: highest price first
    std::map<double, std::deque<Order>, std::greater<double>> buyOrders;

    // SELL: lowest price first
    std::map<double, std::deque<Order>, std::less<double>> sellOrders;

    std::string generateTradeId();

public:
    explicit OrderBook(const std::string& sym);

    std::vector<Trade> addOrder(const Order& incoming);

    bool cancelOrder(const std::string& orderId, Order& cancelledOut);
    bool modifyOrder(const std::string& orderId, double newSize, double newPrice, Order& modifiedOut);

    std::vector<Order> getOpenOrdersFiltered(
        const std::string& requesterUserId,
        bool ownOnly,
        const std::string& sideFilter,
        const std::string& symbolFilter
    ) const;
};

#endif
