#ifndef POSITION_H
#define POSITION_H

#include <string>

struct Position {
    std::string userId;
    std::string symbol;
    double quantity;

    Position() : quantity(0.0) {}
    Position(const std::string& uid, const std::string& sym, double qty)
        : userId(uid), symbol(sym), quantity(qty) {}
};

#endif