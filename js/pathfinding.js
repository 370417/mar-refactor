import Heap from "heap";

console.log(Heap);

// ends - an array of end nodes
// neighbor(node) - returns an array of neighbors of a node
// cost(node1, node2) - returns the cost to move from node1 to node2
const dijkstraMap = ({ends, neighbor, cost}) => {
    const active = new Heap((a, b) => a.cost - b.cost);

    for (let i = 0; i < ends.length; i++) {
        ends[i].cost = 0;
    }
console.log(active);
    //while () {}
};

export {dijkstraMap};
