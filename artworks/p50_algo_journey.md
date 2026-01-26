# Shape Selection Algorithm Improvement Journey

## The Problem

Select 6 unique shapes for a grid layout that feels visually balanced.

Each shape has 4 attributes:
- **Geometric**: triangle, square, circle, dot, line
- **Symmetry**: sym, nonsym  
- **Fill**: filled, outline
- **Density**: dense, sparse

---

## Version 1: Original Algorithm

```
function selectBalancedShape(alreadySelected):
    scores = []
    
    for each shape in ALL_SHAPES:
        score = calculateDiversityScore(shape, alreadySelected)
        scores.push(score)
    
    return weightedRandomPick(ALL_SHAPES, scores)
```

### Problem: Same shape can appear twice

The algorithm considers ALL shapes every time, including ones already picked.

**Example bad outcome:**
```
Position 1: square_filled  
Position 2: square_filled   ← Same shape again!
Position 3: circle_outline
...
```

---

## Version 2: Prevent Duplicates

```
function selectBalancedShape(alreadySelected):
    
    // NEW: Filter out already-used shapes
    available = ALL_SHAPES.filter(shape => 
        shape NOT IN alreadySelected
    )
    
    scores = []
    
    for each shape in available:           // Changed: only available shapes
        score = calculateDiversityScore(shape, alreadySelected)
        scores.push(score)
    
    return weightedRandomPick(available, scores)
```

### Fixed: Each shape can only appear once

**But new problem: Too many filled shapes**

The weighted scoring prefers diversity, but doesn't guarantee it.

**Example bad outcome:**
```
Position 1: square_filled
Position 2: circle_filled  
Position 3: triangle_filled
Position 4: dot_filled      ← 4 filled shapes = heavy feeling!
Position 5: line_outline
Position 6: square_outline
```

---

## Version 3: Hard Limits on Attributes (Current)

```
function selectBalancedShape(alreadySelected):
    
    // Step 1: Exclude already-used shapes
    available = ALL_SHAPES.filter(shape => 
        shape NOT IN alreadySelected
    )
    
    // NEW Step 2: Exclude shapes that would break balance
    balanced = available.filter(shape =>
        countFilled(alreadySelected, shape.fill) < 3  AND
        countGeometric(alreadySelected, shape.geometric) < 3
    )
    
    // Use balanced list if possible, otherwise fallback
    candidates = balanced.length > 0 ? balanced : available
    
    scores = []
    
    for each shape in candidates:
        score = calculateDiversityScore(shape, alreadySelected)
        scores.push(score)
    
    return weightedRandomPick(candidates, scores)
```

### Fixed: Hard cap of 3 per category

With 6 total positions:
- Max 3 filled → at least 3 outline (lighter feel)
- Max 3 of same geometric → variety guaranteed

**Example good outcome:**
```
Position 1: square_filled      (filled: 1, square: 1)
Position 2: circle_outline     (filled: 1, outline: 1)
Position 3: triangle_filled    (filled: 2)
Position 4: dot_outline        (filled: 2, outline: 2)
Position 5: line_filled        (filled: 3) ← limit reached
Position 6: circle_filled      ← BLOCKED, must pick outline
         → square_outline      ✓ (filled: 3, outline: 3)
```

---

## Summary of Changes

| Version | Duplicates? | Balance Guaranteed? |
|---------|-------------|---------------------|
| V1      | Yes ❌      | No ❌               |
| V2      | No ✓        | No ❌               |
| V3      | No ✓        | Yes ✓              |

### Key Insight

Weighted randomness **prefers** good outcomes but doesn't **guarantee** them.

Adding hard limits ensures visual balance while still allowing randomness within those constraints.
