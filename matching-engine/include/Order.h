#ifndef ORDER_H
#define ORDER_H

#include <string>
#include <chrono>

enum class OrderSide { BUY, SELL };
enum class OrderStatus { 
    NEW,
    PENDING,
    PARTIALLY_FILLED,
    FILLED,
    CANCELLED, 
    REJECTED
};

struct Order
{
    std::string orderId;
    std::string userId;
    std::string symbol;
    OrderSide side;
    double price;
    double size;
    double remainingSize;
    OrderStatus status;
    std::chrono::system_clock::time_point timestamp;

    bool isFilled() const {
        return remainingSize <= 0.0001;
    }

    bool isPartiallyFilled() const {
        return remainingSize < size && !isFilled();
    }

};

#endif