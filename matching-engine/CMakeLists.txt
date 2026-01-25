cmake_minimum_required(VERSION 3.10)
project(MatchingEngine)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Include directories
include_directories(include)

# Source files
file(GLOB SOURCES src/*.cpp)

add_executable(matching-engine ${SOURCES})

# Link with librdkafka and pthread
find_package(PkgConfig REQUIRED)
pkg_check_modules(RDKAFKA REQUIRED rdkafka++)
target_include_directories(matching-engine PRIVATE ${RDKAFKA_INCLUDE_DIRS})
target_link_libraries(matching-engine ${RDKAFKA_LIBRARIES} pthread)
