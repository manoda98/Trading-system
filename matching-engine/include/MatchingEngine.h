#ifndef MATCHING_ENGINE_H
#define MATCHING_ENGINE_H

#include "OrderBook.h"
#include "Order.h"
#include "Trade.h"
#include <map>
#include <memory>
#include <vector>
#include <unordered_map>

class MatchingEngine {
private:
    std::map<std::string, std::unique_ptr<OrderBook>> books;

    // histories (unlimited)
    std::vector<Order> orderHistory;
    std::vector<Trade> tradeHistory;

    // quick lookup: orderId -> (symbol)
    std::unordered_map<std::string, std::string> orderIdToSymbol;

    OrderBook& getBook(const std::string& symbol);

public:
    MatchingEngine();

    // submit order into book and return trades
    std::vector<Trade> submit(const Order& order);

    // cancel order
    bool cancel(const std::string& orderId);

    // history access (for queries & snapshots later)
    const std::vector<Order>& getOrderHistory() const { return orderHistory; }
    const std::vector<Trade>& getTradeHistory() const { return tradeHistory; }

    // book access for snapshots later
    const std::map<std::string, std::unique_ptr<OrderBook>>& getBooks() const { return books; }
};

#endif
