#ifndef ORDER_BOOK_H
#define ORDER_BOOK_H

#include "Order.h"
#include "Trade.h"
#include <map>
#include <deque>
#include <string>
#include <vector>
#include <functional>
#include <unordered_map>

class OrderBook {
private:
    std::string symbol;

    // BUY: highest price first
    std::map<double, std::deque<Order>, std::greater<double>> buy;
    // SELL: lowest price first
    std::map<double, std::deque<Order>, std::less<double>> sell;

    struct IndexEntry { bool isBuy; double price; };
    std::unordered_map<std::string, IndexEntry> index; // orderId -> (side, price)

    long long tradeCounter{0};
    std::string nextTradeId();

    void eraseEmptyLevel(bool isBuy, double price);

public:
    explicit OrderBook(std::string sym);

    std::vector<Trade> addOrder(const Order& order);
    bool cancelOrder(const std::string& orderId);
    bool hasOrder(const std::string& orderId) const;

    bool getOrderSidePrice(const std::string& orderId, bool& isBuy, double& price) const;

    const auto& getBuyLevels() const { return buy; }
    const auto& getSellLevels() const { return sell; }
    void loadFromLevels(
        const std::map<double, std::deque<Order>, std::greater<double>>& b,
        const std::map<double, std::deque<Order>, std::less<double>>& s
    );
};

#endif
