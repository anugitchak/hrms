/**
 * Fetches the location name (address) from latitude and longitude using Nominatim (OpenStreetMap)
 * @param {number} lat 
 * @param {number} lon 
 * @returns {Promise<string>}
 */
export const reverseGeocode = async (lat, lon) => {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
            {
                headers: {
                    'Accept-Language': 'en-US,en;q=0.9',
                    'User-Agent': 'HRMS-App' // Good practice to identify your app
                }
            }
        );
        const data = await response.json();
        return data.display_name || "Unknown Location";
    } catch (error) {
        console.error("Reverse geocoding error:", error);
        return "Unknown Location";
    }
};
