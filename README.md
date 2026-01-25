# Intoduction

This project is a high-performance trading system built with a C++ in-memory matching engine and a Node.js order manager, communicating through Apache Kafka using a synchronous request–response model.

# Architecture Overview

**Frontend (React)**: User interface

**Order Manager (Node.js / Express)**: API gateway, validation, Kafka producer/consumer

**Matching Engine (C++)**: Order matching, positions, trades, snapshots

**Kafka**: Event backbone between services

**MongoDB**: Users and instruments only (no trading state)

# Key Highlights

- C++ Matching Engine with in-memory order books and positions

- Kafka-based communication (ME_IN / ME_OUT)

- Synchronous order processing with 15s timeout

- Snapshot-based recovery every 10 minutes

- Unified position model for all assets (BTC, USD, ETH, etc.)

- Strict balance validation (no negative balances)
