import Map from 'https://cdn.skypack.dev/ol/Map.js';
import View from 'https://cdn.skypack.dev/ol/View.js';
import TileLayer from 'https://cdn.skypack.dev/ol/layer/Tile.js';
import OSM from 'https://cdn.skypack.dev/ol/source/OSM.js';
import Overlay from 'https://cdn.skypack.dev/ol/Overlay.js';
import { toLonLat, fromLonLat } from 'https://cdn.skypack.dev/ol/proj.js';
import Feature from 'https://cdn.skypack.dev/ol/Feature.js';
import Point from 'https://cdn.skypack.dev/ol/geom/Point.js';
import VectorSource from 'https://cdn.skypack.dev/ol/source/Vector.js';
import VectorLayer from 'https://cdn.skypack.dev/ol/layer/Vector.js';
import { Style, Icon } from 'https://cdn.skypack.dev/ol/style.js';
import Swal from "https://cdn.skypack.dev/sweetalert2";

const tileLayer = new TileLayer({
  source: new OSM(),
  visible: true,
});

const map = new Map({
  target: "map",
  layers: [tileLayer],
  view: new View({
    center: fromLonLat([107.57634352477324, -6.87436891415509]),
    zoom: 16,
  }),
});

// Pop-up untuk informasi lokasi
const popup = document.createElement('div');
popup.className = 'popup';
document.body.appendChild(popup);

const overlay = new Overlay({
  element: popup,
  autoPan: true,
});
map.addOverlay(overlay);

// Sumber data marker
const markerSource = new VectorSource();
const markerLayer = new VectorLayer({
  source: markerSource,
});
map.addLayer(markerLayer);

document.getElementById("set-source").onclick = function () {
  tileLayer.setVisible(true);
  Swal.fire({
    title: "Peta Aktif!",
    text: "Layer peta sudah muncul, silakan navigasi sesuka hati!",
    icon: "success",
    confirmButtonColor: "#28a745",
  });
};

document.getElementById("unset-source").onclick = function () {
  tileLayer.setVisible(false);
  Swal.fire({
    title: "Layer Disembunyikan",
    text: "Layer peta telah dinonaktifkan, klik 'Show Layer' untuk menampilkan kembali.",
    icon: "warning",
    confirmButtonColor: "#ff851b",
  });
};
map.on("click", async function (event) {
  const clickedCoordinates = toLonLat(event.coordinate);
  const [longitude, latitude] = clickedCoordinates;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lon=${longitude}&lat=${latitude}`
    );
    const data = await response.json();
    const locationName = data.display_name || "Alamat tidak ditemukan";

    // Hapus semua marker kecuali marker lokasi pengguna
    markerSource.getFeatures().forEach((feature) => {
      if (!feature.get("isUserLocation")) {
        markerSource.removeFeature(feature);
      }
    });

    const marker = new Feature({
      geometry: new Point(fromLonLat([longitude, latitude])),
    });
    marker.setStyle(
      new Style({
        image: new Icon({
          src: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
          scale: 0.05,
          color: "blue"
        }),
      })
    );
    marker.set("isBlueMarker", true);
    markerSource.addFeature(marker);

    popup.innerHTML = `
      <div class="location-popup">
        <h3><i class="fas fa-map-marker-alt"></i> Informasi Lokasi</h3>
        <div class="location-details">
          <p><strong>Alamat:</strong> ${locationName}</p>
          <p><strong>Koordinat:</strong> ${longitude.toFixed(6)}, ${latitude.toFixed(6)}</p>
        </div>
      </div>`;
    overlay.setPosition(event.coordinate);
  } catch (error) {
    console.error("Gagal mengambil alamat:", error);
  }
});

function getLocation() {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      const userCoordinates = fromLonLat([longitude, latitude]);
      map.getView().setCenter(userCoordinates);
      map.getView().setZoom(16);

      const userMarker = new Feature({
        geometry: new Point(userCoordinates),
      });
      userMarker.setStyle(
        new Style({
          image: new Icon({
            src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
            scale: 0.05,
            color: 'red'
          }),
        })
      );
      userMarker.set("isUserLocation", true);
      markerSource.addFeature(userMarker);

      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lon=${longitude}&lat=${latitude}`)
        .then((response) => response.json())
        .then((data) => {
          const locationName = data.display_name || 'Tidak ada data lokasi';
          popup.innerHTML = `
            <div class="location-popup">
              <h3><i class="fas fa-map-marker-alt"></i> Lokasi Anda</h3>
              <div class="location-details">
                <p><strong>Alamat:</strong> ${locationName}</p>
                <p><strong>Koordinat:</strong> ${longitude.toFixed(6)}, ${latitude.toFixed(6)}</p>
              </div>
            </div>`;
          overlay.setPosition(userCoordinates);
        })
        .catch(() => {
          popup.innerHTML = `
            <div class="location-popup">
              <h3><i class="fas fa-exclamation-circle"></i> Lokasi Anda</h3>
              <div class="location-details">
                <p>Data lokasi tidak ditemukan.</p>
                <p><strong>Koordinat:</strong> ${longitude.toFixed(6)}, ${latitude.toFixed(6)}</p>
              </div>
            </div>`;
          overlay.setPosition(userCoordinates);
        });
    },
    () => {
      alert('Gagal mengambil lokasi. Pastikan Anda memberikan izin akses lokasi.');
    }
  );
}

getLocation();


/* CSS tambahan untuk mempercantik popup */





document.getElementById('refreshLocation').addEventListener('click', getLocation);
document.getElementById('shareLocation').addEventListener('click', () => {
  navigator.geolocation.getCurrentPosition((pos) => {
    const { latitude, longitude } = pos.coords;
    const shareUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Link lokasi Anda telah disalin ke clipboard!');
    });
  });
});

getLocation();
