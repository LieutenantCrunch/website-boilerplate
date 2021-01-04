// Note: While these don't throw compile errors and work fine with IntelliSense, they show up undefined at runtime
// Add a set operations to the Set object.
interface Set<T> {
    difference(compareSet: Set<T>): Set<T>;
    intersection(compareSet: Set<T>): Set<T>;
    symmetricDifference(compareSet: Set<T>): Set<T>;
    union(compareSet: Set<T>): Set<T>;    
}

Set.prototype.difference = function <T>(compareSet: Set<T>): Set<T> {
    let _difference = new Set<T>(this);

    for (let elem of compareSet) {
        _difference.delete(elem);
    }
    return _difference;
};

Set.prototype.intersection = function <T>(compareSet: Set<T>): Set<T> {
    let _intersection = new Set<T>();

    for (let elem of compareSet) {
        if (this.has(elem)) {
            _intersection.add(elem);
        }
    }

    return _intersection;
};

Set.prototype.symmetricDifference = function <T>(compareSet: Set<T>): Set<T> {
    let _difference = new Set<T>(this);

    for (let elem of compareSet) {
        if (_difference.has(elem)) {
            _difference.delete(elem);
        } else {
            _difference.add(elem);
        }
    }
    return _difference;
};

Set.prototype.union = function <T>(compareSet: Set<T>): Set<T> {
    let _union = new Set<T>(this);
    
    for (let elem of compareSet) {
        _union.add(elem);
    }

    return _union;
};
