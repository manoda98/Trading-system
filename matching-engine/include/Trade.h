#ifndef TRADE_H
#define TRADE_H

#include <string>
#include <chrono>

struct Trade {
    std::string tradeId;

    std::string buyOrderId;
    std::string sellOrderId;

    std::string buyUserId;
    std::string sellUserId;

    std::string symbol;
    double price = 0.0;
    double quantity = 0.0;
    std::chrono::system_clock::time_point timestamp;
};

#endif
