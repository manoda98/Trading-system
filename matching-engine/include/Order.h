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

inline std::string toString(OrderSide s) { return (s == OrderSide::BUY) ? "BUY" : "SELL"; }
inline std::string toString(OrderStatus st) {
    switch (st) {
        case OrderStatus::NEW: return "NEW";
        case OrderStatus::PENDING: return "PENDING";
        case OrderStatus::PARTIALLY_FILLED: return "PARTIALLY_FILLED";
        case OrderStatus::FILLED: return "FILLED";
        case OrderStatus::CANCELLED: return "CANCELLED";
        case OrderStatus::REJECTED: return "REJECTED";
    }
    return "UNKNOWN";
}

struct Order {
    std::string orderId;
    std::string userId;
    std::string symbol;  
    OrderSide side{};
    double price{0.0};
    double size{0.0};
    double remainingSize{0.0};
    OrderStatus status{OrderStatus::NEW};
    std::chrono::system_clock::time_point timestamp{};

    bool isFilled() const { 
        return remainingSize <= 0.0001; 
    }
    bool isPartiallyFilled() const { 
        return remainingSize < size && !isFilled(); 
    }
};

#endif
