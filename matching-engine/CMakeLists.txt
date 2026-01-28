cmake_minimum_required(VERSION 3.10)
project(matching_engine)

set(CMAKE_CXX_STANDARD 17)

include_directories(include)

find_package(PkgConfig REQUIRED)
pkg_check_modules(RDKAFKA REQUIRED rdkafka++)

add_executable(matching-engine
    src/main.cpp
    src/KafkaHandler.cpp
    src/MatchingEngine.cpp
    src/OrderBook.cpp
)

target_include_directories(matching-engine PRIVATE ${RDKAFKA_INCLUDE_DIRS})
target_link_libraries(matching-engine ${RDKAFKA_LIBRARIES})
target_compile_options(matching-engine PRIVATE ${RDKAFKA_CFLAGS_OTHER})
