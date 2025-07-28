#include <nlohmann/json.hpp>
#include <vector>
#include <queue>
#include <limits>
#include <iostream>
using json = nlohmann::json;

struct Edge {
  int to;
  double weight;
};

struct Compare {
  bool operator()(const std::pair<double, int>& a, const std::pair<double, int>& b) {
    return a.first > b.first;
  }
};

std::vector<int> dijkstra(std::vector<std::vector<Edge>>& graph, int start, int end) {
  int n = graph.size();
  std::vector<double> dist(n, 1e9);
  std::vector<int> prev(n, -1);
  std::priority_queue<std::pair<double, int>, std::vector<std::pair<double, int>>, std::greater<>> pq;

  dist[start] = 0;
  pq.push({0, start});

  while (!pq.empty()) {
    double d = pq.top().first;
    int u = pq.top().second;
    pq.pop();
    if (d > dist[u]) continue;
    for (const auto& e : graph[u]) {
      if (dist[u] + e.weight < dist[e.to]) {
        dist[e.to] = dist[u] + e.weight;
        prev[e.to] = u;
        pq.push({dist[e.to], e.to});
      }
    }
  }

  std::vector<int> path;
  for (int v = end; v != -1; v = prev[v]) path.push_back(v);
  std::reverse(path.begin(), path.end());
  return path;
}

int main(int argc, char* argv[]) {
  if (argc != 2) {
    std::cerr << "Usage: " << argv[0] << " <input_json>" << std::endl;
    return 1;
  }

  json input = json::parse(argv[1]);
  auto dustbins = input["dustbins"];
  auto dustbinIds = input["dustbinIds"];
  auto graph_json = input["graph"];
  int n = dustbins.size();
  std::vector<std::vector<Edge>> graph(n);

  
  std::map<int, int> idToIndex;
  for (int i = 0; i < n; ++i) {
    idToIndex[dustbinIds[i].get<int>()] = i;
  }

  for (int i = 0; i < n; i++) {
    for (const auto& edge : graph_json[i]) {
      int toId = edge["to"].get<int>();
      int toIndex = idToIndex[toId]; // Convert ID to index
      graph[i].push_back({toIndex, edge["weight"].get<double>()});
    }
  }


  std::vector<bool> visited(n, false);
  std::vector<int> route;
  int current = 0;
  visited[current] = true;
  route.push_back(dustbinIds[current].get<int>());

  for (int i = 1; i < n; ++i) {
    double minDist = 1e9;
    int next = -1;
    for (int j = 0; j < n; ++j) {
      if (!visited[j]) {
        for (const auto& edge : graph[current]) {
          if (edge.to == j && edge.weight < minDist) {
            minDist = edge.weight;
            next = j;
          }
        }
      }
    }
    if (next == -1) break;
    visited[next] = true;
    route.push_back(dustbinIds[next].get<int>());
    current = next;
  }

  std::cout << json(route).dump() << std::endl;
  return 0;
}