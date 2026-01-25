#ifndef TRADE_H
#define TRADE_H

#include <string>
#include <chrono>

struct Trade {
    std::string tradeId;
    std::string buyOrderId;
    std::string sellOrderId;
    std::string symbol;
    double price;
    double quantity;
    std::chrono::system_clock::time_point timestamp;
};

#endif