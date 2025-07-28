#include <iostream>
#include <queue>
#include <nlohmann/json.hpp>
using json = nlohmann::json;

struct Dustbin {
  int id;
  int fill_level;
  bool operator<(const Dustbin& other) const {
    return fill_level < other.fill_level;
  }
};

int main(int argc, char* argv[]) {
  if (argc != 2) {
    std::cerr << "Usage: " << argv[0] << " <dustbins_json>" << std::endl;
    return 1;
  }
  json dustbins = json::parse(argv[1]);
  std::priority_queue<Dustbin> pq;

  for (const auto& d : dustbins) {
    pq.push({d["id"].get<int>(), d["fill_level"].get<int>()});
  }

  std::vector<int> result;
  while (!pq.empty()) {
    result.push_back(pq.top().id);
    pq.pop();
  }

  std::cout << json(result).dump() << std::endl;
  return 0;
}