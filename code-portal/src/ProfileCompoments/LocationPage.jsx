"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Navigation, Loader2, Save, X } from "lucide-react";
import "leaflet/dist/leaflet.css";
import toast from "react-hot-toast";

// --- Leaflet Icon Fix ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// --- MapUpdater ---
function MapUpdater({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo([position.lat, position.lng], 13, { animate: true });
  }, [position, map]);
  return null;
}

// --- DraggableMarker ---
function DraggableMarker({ position, onDrag }) {
  const markerRef = useRef(null);
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker) onDrag(marker.getLatLng());
      },
    }),
    [onDrag]
  );

  return (
    <Marker draggable eventHandlers={eventHandlers} position={position} ref={markerRef}>
      <Popup>
        <div className="text-center">
          <p className="font-semibold">Selected Location</p>
          <p className="text-xs text-gray-500">Drag to adjust</p>
        </div>
      </Popup>
    </Marker>
  );
}

// --- Fetch user coordinates ---
const fetchUserCoordinates = async () => {
  const res = await axios.get("http://localhost:8000/users/urCoordinates", {
    withCredentials: true,
  });
  const coords = res.data?.data?.location?.coordinates;
  if (!coords) throw new Error("User coordinates not found");
  // API returns [lng, lat] → convert to {lat, lng}
  return { lat: coords[1], lng: coords[0] };
};

// --- Main component ---
const LocationDialog = ({ open, onClose }) => {
  const [markerPos, setMarkerPos] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // --- React Query ---
  const { data, isLoading } = useQuery({
    queryKey: ["userCoordinates"],
    queryFn: fetchUserCoordinates,
    enabled: open,
    retry: false,
    onSuccess: (coords) => setMarkerPos(coords),
    onError: (err) => toast.error(err.message || "Failed to fetch coordinates"),
  });

  useEffect(() => {
    // update markerPos when API returns
    if (data) setMarkerPos(data);
  }, [data]);

  if (!open) return null;

  // --- Search using Nominatim ---
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await axios.get("https://nominatim.openstreetmap.org/search", {
        params: { q: searchQuery, format: "json", limit: 1 },
      });
      if (response.data.length > 0) {
        const { lat, lon } = response.data[0];
        setMarkerPos({ lat: parseFloat(lat), lng: parseFloat(lon) });
      } else toast.error("Location not found");
    } catch {
      toast.error("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  // --- GPS logic ---
  const handleUseMyLocation = () => {
    setLoading(true);
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setMarkerPos({ lat: latitude, lng: longitude });
        setLoading(false);
      },
      () => {
        toast.error("Unable to retrieve location");
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // --- Confirm & Save logic ---
  const handleConfirm = async () => {
    if (!markerPos) return;
    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:8000/users/upCoordinates",
        { latitude: markerPos.lat, longitude: markerPos.lng },
        { withCredentials: true }
      );
      if (res.status === 200) {
        toast.success("Location updated successfully!");
        onClose();
      }
    } catch {
      toast.error("Failed to save location");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
      />
      <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] sm:w-[85vw] max-w-4xl h-[90vh] sm:h-auto sm:max-h-[85vh] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-none">
                Set Location
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Pin your location for the leaderboard
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-white dark:bg-gray-950">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Input
                  placeholder="Search city, street, or place..."
                  className="pl-9 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" variant="secondary" disabled={searching} className="dark:bg-gray-800 dark:hover:bg-gray-700">
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
              </Button>
            </form>
            <Button
              variant="outline"
              onClick={handleUseMyLocation}
              disabled={loading}
              className="whitespace-nowrap border-gray-200 dark:border-gray-800 dark:bg-transparent dark:hover:bg-gray-800"
            >
              {loading && !markerPos ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Navigation className="w-4 h-4 mr-2 text-blue-500" />
              )}
              Use GPS
            </Button>
          </div>

          {/* Map */}
          <div className="relative w-full h-[300px] sm:h-[400px] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-inner bg-gray-100 dark:bg-gray-900 z-0">
            {(!markerPos || isLoading) && (
              <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/10">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            )}
            {markerPos && (
              <MapContainer
                center={[markerPos.lat, markerPos.lng]}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapUpdater position={markerPos} />
                <DraggableMarker position={markerPos} onDrag={setMarkerPos} />
              </MapContainer>
            )}
          </div>

          {/* Coordinates Display */}
          <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <span className="text-gray-500 dark:text-gray-400">Selected Coordinates:</span>
            <span className="font-mono font-medium text-gray-900 dark:text-gray-200">
              {markerPos
                ? `${markerPos.lat.toFixed(6)}, ${markerPos.lng.toFixed(6)}`
                : "Not selected"}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full sm:w-auto text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!markerPos || loading}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white dark:bg-green-600 dark:hover:bg-green-700"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Confirm Location
          </Button>
        </div>
      </div>
    </>
  );
};

export default LocationDialog;
