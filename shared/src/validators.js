function isValidCoordinate(lat, lng) {
  return (
    typeof lat === 'number' && lat >= -90 && lat <= 90 &&
    typeof lng === 'number' && lng >= -180 && lng <= 180
  );
}

function isValidRadius(km) {
  return typeof km === 'number' && km > 0 && km <= 50;
}

function isValidRating(rating) {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

module.exports = { isValidCoordinate, isValidRadius, isValidRating };
