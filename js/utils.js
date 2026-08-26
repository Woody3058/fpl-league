
function getRankedPosition(value, index, previousValue, previousPosition) {

    if (previousValue !== null && value === previousValue) {
        return previousPosition;
    }
    return index + 1;
}