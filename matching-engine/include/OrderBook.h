#ifndef ORDER_BOOK_H
#define ORDER_BOOK_H

#include "Order.h"
#include "Trade.h"
#include <map>
#include <queue>
#include <string>
#include <vector>

class OrderBook {
    private:
        std::string symbol;

        //buy orders: highest price first
        std::map<double, std::queue<Order>, std::greater<double>> buyOrders;

        //sell orders: lowest price first
        std::map<double, std::queue<Order>, std::less<double>> sellOrders;

        //Map orderid price for fast lookup
        std::map<std::string,double> orderPriceMap;

        std::string generateTradeId();
        bool removeOrder(const std::string& orderId, bool isBuy);

    public:
        OrderBook(const std::string& symbol);

        //add order and return trades if matched
        std::vector<Trade> addOrder(const Order& order);

        //cancel order
        bool cancelOrder(const std::string& orderId);

        //modify order
        std::vector<Trade> modifyOrder(const std::string& orderId, double newSize, double newPrice);

        double getBestBid() const;
        double getBestAsk() const;
};

#endif