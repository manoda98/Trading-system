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
    std::vector<Trade> submitOrder(const Order& order);
};

#endif
