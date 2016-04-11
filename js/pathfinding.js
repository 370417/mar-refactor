import Heap from "heap";

// graph - an array of nodes
// end(node) - returns true if node is an end node
// neighbor(node) - returns an array of neighbors of a node
// cost(node1, node2) - returns the cost to move from node1 to node2
const dijkstraMap = ({graph, end, neighbor, cost}) => {
    const unvisited = new Heap((a, b) => a.cost - b.cost);

    for (let i = 0; i < graph.length; i++) {
        const node = graph[i];
        node.cost = end(node) ? 0 : Infinity;
        unvisited.push(node);
    }

    while (unvisited.peek()) {
        const node = unvisited.pop();
        node.visited = true;
        neighbor(node).forEach(neighbor => {
            if (neighbor.visited) { return; }
            const altCost = node.cost + cost(node, neighbor);
            if (altCost < neighbor.cost) {
                neighbor.cost = altCost;
                neighbor.prev = node;
            }
        });
    }

    return graph;
};

export {dijkstraMap};
