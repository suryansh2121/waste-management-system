#include <iostream>
#include <vector>
#include <cmath>
#include <nlohmann/json.hpp>
using json = nlohmann::json;

struct Point {
  double x, y;
  int id;
};

struct Node {
  double x, y, width, height;
  std::vector<Point> points;
  Node* children[4] = {nullptr, nullptr, nullptr, nullptr};
  Node(double x_, double y_, double w_, double h_) : x(x_), y(y_), width(w_), height(h_) {}
};

class QuadTree {
  Node* root;
  int capacity = 4;

  void insert(Point p, Node* node) {
    if (node->points.size() < capacity) {
      node->points.push_back(p);
      return;
    }
    if (!node->children[0]) {
      double w = node->width / 2, h = node->height / 2;
      node->children[0] = new Node(node->x, node->y, w, h);
      node->children[1] = new Node(node->x + w, node->y, w, h);
      node->children[2] = new Node(node->x, node->y + h, w, h);
      node->children[3] = new Node(node->x + w, node->y + h, w, h);
    }
    int index = (p.x > node->x + node->width / 2) + 2 * (p.y > node->y + node->height / 2);
    insert(p, node->children[index]);
  }

  void queryRange(double x, double y, double radius, Node* node, std::vector<int>& result) {
    if (!node) return;
    for (const auto& p : node->points) {
      double dist = sqrt(pow(p.x - x, 2) + pow(p.y - y, 2));
      if (dist <= radius) result.push_back(p.id);
    }
    for (int i = 0; i < 4; i++) {
      if (node->children[i]) queryRange(x, y, radius, node->children[i], result);
    }
  }

public:
  QuadTree(double x, double y, double w, double h) {
    root = new Node(x, y, w, h);
  }

  void insert(Point p) { insert(p, root); }

  std::vector<int> query(double x, double y, double radius) {
    std::vector<int> result;
    queryRange(x, y, radius, root, result);
    return result;
  }
};

int main(int argc, char* argv[]) {
  if (argc != 5) {
    std::cerr << "Usage: " << argv[0] << " <x> <y> <radius> <dustbins_json>" << std::endl;
    return 1;
  }
  double x = std::stod(argv[1]), y = std::stod(argv[2]), radius = std::stod(argv[3]);
  json dustbins = json::parse(argv[4]);

  QuadTree qt(-180, -90, 360, 180); 
    for (const auto& d : dustbins) {
    qt.insert({d["latitude"].get<double>(), d["longitude"].get<double>(), d["id"].get<int>()});
  }

  std::vector<int> result = qt.query(x, y, radius);
  std::cout << json(result).dump() << std::endl;
  return 0;
}