<!-- 62689233-2f76-46f8-8289-fb0d9af3f860 41ecd9fe-fc39-42d5-a5b9-22e6328fdf41 -->
# Fix WhatsApp Icon Drag Viewport Constraints

## Problem

When dragging the WhatsApp icon, it moves outside the visible viewport edges and becomes unfindable. This happens because:

1. The drag constraints are based on a container that may include scrollable content
2. The position calculation doesn't account for viewport boundaries
3. The element can be dragged into areas that require scrolling to see

## Solution

### 1. Fix Drag Constraints

- Calculate constraints based on viewport dimensions (not document dimensions)
- Account for the button's size when calculating boundaries
- Ensure the button stays within `0` to `viewportWidth - buttonWidth` for X
- Ensure the button stays within `0` to `viewportHeight - buttonHeight` for Y

### 2. Update Position Calculation

- Use viewport-relative coordinates instead of document-relative
- Calculate maximum drag positions based on current viewport size
- Clamp position values to stay within bounds

### 3. Use Manual Constraints

- Replace `dragConstraints={constraintsRef}` with manual constraint calculation
- Calculate constraints dynamically based on viewport size and button dimensions
- Use `dragConstraints={{ left, right, top, bottom }}` with calculated values

### 4. Handle Viewport Resize

- Add resize listener to recalculate constraints when viewport size changes
- Update constraints when window is resized

## Implementation Details

### Files to Modify

- `Frontend/src/components/WhatsAppFloatingButton.tsx`
- Add viewport size tracking
- Calculate button dimensions
- Implement manual drag constraints
- Add resize handler for dynamic constraint updates
- Ensure position is clamped to viewport boundaries