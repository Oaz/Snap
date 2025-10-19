

(function (SE) {

  function listify(x) {
    //console.log(x);
    if (x === undefined)
      return undefined;
    if (x.contents)
      return x;
    if (x instanceof dataStructureTyped.DirectedEdge)
      return new List([listify(x.src), listify(x.dest), listify(x.weight), listify(x.value)]);
    if (x instanceof dataStructureTyped.UndirectedEdge)
      return new List([listify(x.src), listify(x.dest), listify(x.weight), listify(x.value)]);
    if (x.key)
      return new List([listify(x.key), listify(x.value)]);
    if (typeof x === 'object')
      return new List(Array.from(x, y => listify(y)));
    return x;
  }

  function readKey(x) {
    if (x.contents)
      return x.contents[0];
    else
      return x;
  }

  const helper = {

    unsupportedOperationForDataStructure: (ds, op) => new Error(`Unsupported Operation "${op}"`),
    unknownDataStructure: (name) => new Error(`Unknown Data Structure "${name}"`),
    unsupportedDataStructure: (ds) => new Error(`Unsupported Data Structure`)

  };

  SE.primitives.set(
    'dts_create(typename)',
    function (typename) {
      if (typename === "HashMap")
        return new dataStructureTyped.HashMap();
      if (typename === "DirectedGraph")
        return new dataStructureTyped.DirectedGraph();
      if (typename === "UndirectedGraph")
        return new dataStructureTyped.UndirectedGraph();
      throw helper.unknownDataStructure(typename);
    }
  );

  SE.primitives.set(
    'dts_add_or_replace(ds,items)',
    function (ds, items) {

      //console.log(ds);
      //console.log(items);

      if (ds instanceof dataStructureTyped.DirectedGraph
        || ds instanceof dataStructureTyped.UndirectedGraph) {
        for (let i = 0; i < items.contents.length; i++) {
          kv = items.contents[i];
          if (kv.contents) {
            if (kv.contents[0] == '__edge__')
              ds.addEdge(kv.contents[1], kv.contents[2], kv.contents[3], kv.contents[4]);
            else
              ds.addVertex(kv.contents[0], kv.contents[1]);
          } else {
            ds.addVertex(kv);
          }
        }
        return;
      }

      if (ds.set) {
        for (let i = 0; i < items.contents.length; i++) {
          kv = items.contents[i].contents;
          ds.set(kv[0], kv[1]);
        }
        return;
      }

      throw helper.unsupportedDataStructure(ds);
    }
  );

  SE.primitives.set(
    'dts_remove(ds,items)',
    function (ds, items) {

      //console.log(ds);

      if (ds instanceof dataStructureTyped.DirectedGraph
        || ds instanceof dataStructureTyped.UndirectedGraph) {

        for (let i = 0; i < items.contents.length; i++) {
          kv = items.contents[i];
          if (kv.contents) {
            if (kv.contents[0] == '__edge__')
              ds.deleteEdge({ src: kv.contents[1], dest: kv.contents[2] });
            else
              ds.deleteVertex(kv.contents[0]);
          } else {
            ds.deleteVertex(kv);
          }
        }

        return;
      }

      if (ds.delete) {

        for (let i = 0; i < items.contents.length; i++) {
          kv = items.contents[i]
          if (kv.contents)
            ds.delete(kv.contents[0]);
          else
            ds.delete(kv);
        }
        return;
      }

      throw helper.unsupportedDataStructure(ds);
    }
  );

  function run_tarjan(ds) {
    console.log(ds);
    console.log('TARJAN');
    let result = ds.tarjan(true, true, true, true);
    //console.log(result);
    return listify(result);
  }


  SE.primitives.set(
    'dts_request(ds,request)',
    function (ds, request) {
      //console.log(`request:${request}`);

      if (request == "key and values" && ds.entries)
        return listify(ds.entries());
      if (request == "keys" && ds.keys)
        return listify(ds.keys());
      if (request == "values" && ds.values)
        return listify(ds.values());
      if (request == "edges" && ds.edgeSet)
        return listify(ds.edgeSet());
      if (request == "topological sort" && ds.topologicalSort)
        return listify(ds.topologicalSort());
      if (request == "cycles" && ds.getCycles)
        return listify(Array.from(ds.getCycles().values(), cycle => Array.from(cycle.values(), vertex => vertex.key)));
      if (request == "strongly connected components" && ds.getSCCs)
        return listify(Array.from(ds.getSCCs().values(), scc => Array.from(scc.values(), vertex => vertex.key)));
      if (request == "bridges" && ds.getBridges)
        return listify(ds.getBridges());
      if (request == "cut vertexes" && ds.getCutVertexes)
        return listify(Array.from(ds.getCutVertexes(), cv => cv.key));

      throw helper.unsupportedOperationForDataStructure(ds, request);
    }
  );

  SE.primitives.set(
    'dts_request_between(ds,request,source,destination)',
    function (ds, request, source, destination) {
      //console.log(`request:${request}`);

      if (request == "all paths" && ds.getAllPathsBetween)
        return listify(Array.from(ds.getAllPathsBetween(source, destination), path => Array.from(path, vertex => vertex.key)));

      throw helper.unsupportedOperationForDataStructure(ds, request);
    }
  );

  SE.primitives.set(
    'dts_get(ds,key)',
    function (ds, key) {

      //console.log(ds);

      if (ds.get)
        return ds.get(readKey(key));
      else if (ds.getVertex)
        return ds.getVertex(readKey(key)).value;

      throw helper.unsupportedDataStructure(ds);
    }
  );

  SE.primitives.set(
    'dts_has(ds,key)',
    function (ds, key) {

      //console.log(ds);

      if (ds.has)
        return ds.has(readKey(key));
      else if (ds.hasVertex)
        return ds.hasVertex(readKey(key));

      throw helper.unsupportedDataStructure(ds);
    }
  );

  SE.primitives.set(
    'dts_dijkstra(ds,source,destination)',
    function (ds, source, destination) {

      if (ds instanceof dataStructureTyped.DirectedGraph
        || ds instanceof dataStructureTyped.UndirectedGraph) {
        let result = ds.dijkstra(
          readKey(source),
          readKey(destination),
          true,
          true
        );
        //console.log(result);
        var sresult = [
          result.minDist,
          new dataStructureTyped.HashMap(
            Array.from(result.distMap).filter(x => x[1] != 'Infinity').map(x => [x[0].key, x[1]])
          ),
          new dataStructureTyped.HashMap(
            Array.from(result.preMap).filter(x => x[1]).map(x => [x[0].key, x[1].key])
          ),
          listify(result.minPath.map(x => x.key)),
          listify(result.paths.map(p => listify(p.map(x => x.key))))
        ];
        return new List(sresult);
      }

      throw helper.unsupportedDataStructure(ds);
    }
  );

  SE.primitives.set(
    'dts_bellman_ford(ds,source)',
    function (ds, source) {

      if (ds instanceof dataStructureTyped.DirectedGraph
        || ds instanceof dataStructureTyped.UndirectedGraph) {
        let result = ds.bellmanFord(
          readKey(source),
          true,
          true,
          true
        );

        //console.log(result);
        var sresult = [
          result.min,
          new dataStructureTyped.HashMap(
            Array.from(result.distMap).filter(x => x[1] != 'Infinity').map(x => [x[0].key, x[1]])
          ),
          new dataStructureTyped.HashMap(
            Array.from(result.preMap).filter(x => x[1]).map(x => [x[0].key, x[1].key])
          ),
          listify(result.minPath.map(x => x.key)),
          listify(result.paths.map(p => listify(p.map(x => x.key))))
        ];
        return new List(sresult);
      }

      throw helper.unsupportedDataStructure(ds);
    }
  );

  SE.primitives.set(
    'dts_request_shortest_path(request,sp_result)',
    function (request, sp_result) {

      if (request == "minimum distance")
        return sp_result.contents[0];
      if (request == "distances")
        return sp_result.contents[1];
      if (request == "previous")
        return sp_result.contents[2];
      if (request == "shortest path")
        return sp_result.contents[3];
      if (request == "paths")
        return sp_result.contents[4];

      throw helper.unsupportedOperationForDataStructure(ds, request);
    }
  );


})(SnapExtensions);



