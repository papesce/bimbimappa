import { useState, useEffect, useCallback, useRef } from 'react'
import { MapPin, List, Plus, X, SlidersHorizontal } from 'lucide-react'
import Map from './components/Map'
import AddPlacePanel from './components/AddPlacePanel'
import PlacesList from './components/PlacesList'
import BottomSheet from './components/BottomSheet'
import UnifiedSearchInput from './components/UnifiedSearchInput'
import ExportButton from './components/ExportButton'
import LocationControls from './components/LocationControls'
import MobileExplorer from './components/MobileExplorer'
import MobileFilterSheet from './components/MobileFilterSheet'
import AccessDenied from './components/AccessDenied'
import Toast from './components/Toast'
import { usePlaces } from './hooks/usePlaces'
import { useAuth } from './hooks/useAuth'
import { useMapFocus } from './hooks/useMapFocus'
import { useIsMobile } from './hooks/useIsMobile'
import { FILTERS, getFilterRange } from './lib/filters'
import { formatAmenity, formatPriceTier, formatPriority } from './lib/placeAttributes'
import { getPlacesWithinBounds, getPlacesWithinRadius, getDistanceKm } from './lib/geo'
import './index.css'
import type { FilterKey, GeoPoint, MapBounds, PanelState, Place, PlaceCategory, PlaceInput, SheetState, ViewingPlace, PriceTier, PriorityLevel } from './types'

const EXPLORE_RADIUS_KM = 5

export default function App() {
  const { authed, login } = useAuth()
  const { places, loading, addPlace, deletePlace, restorePlace, updatePlace } = usePlaces()
  const { center, radius, cityName, stateName, countryCode, matchedPlaces, isGeolocating, setCenter, setRadius, setFocusCenter, clearCenter, resetToGeolocation } = useMapFocus(places)
  const isMobile = useIsMobile()
  const [panel, setPanel] = useState<PanelState>(null)
  const [editingPlace, setEditingPlace] = useState<Place | null>(null)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [focusPlace, setFocusPlace] = useState<GeoPoint | null>(null)
  const [newPlaceId, setNewPlaceId] = useState<string | null>(null)
  const [popupPlaceId, setPopupPlaceId] = useState<string | null>(null)
  const [viewportBounds, setViewportBounds] = useState<MapBounds | null>(null)
  const [boundsRadius, setBoundsRadius] = useState<number | null>(null)
  const [viewingPlace, setViewingPlace] = useState<ViewingPlace | null>(null)
  const [fitBoundsTrigger, setFitBoundsTrigger] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [previewArea, setPreviewArea] = useState<GeoPoint | null>(null)
  const [suppressFit, setSuppressFit] = useState(0)
  const [hoverRadiusKm, setHoverRadiusKm] = useState<number | null>(null)
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [sheetState, setSheetState] = useState<SheetState>('hidden')
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [deletedPlace, setDeletedPlace] = useState<Place | null>(null)
  const [hoverPlaceId, setHoverPlaceId] = useState<string | null>(null)
  const [amenityFilters, setAmenityFilters] = useState<string[]>([])
  const [priceFilter, setPriceFilter] = useState<PriceTier | null>(null)
  const [priorityFilter, setPriorityFilter] = useState<PriorityLevel | null>(null)
  const [ratingFilter, setRatingFilter] = useState<number | null>(null)
  const [mobileCategory, setMobileCategory] = useState<PlaceCategory | null>(null)
  const [browseQuery, setBrowseQuery] = useState('')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [previousMobileArea, setPreviousMobileArea] = useState<{
    center: GeoPoint | null
    radius: number
    cityName: string
    stateName: string
    countryCode: string
  } | null>(null)
  const undoTimeoutRef = useRef<number | null>(null)

  useEffect(() => () => { if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current) }, [])

  // Hover highlight on the "Viewing" chip is ephemeral — reset whenever the viewed place changes
  useEffect(() => {
    setHoverPlaceId(null)
  }, [viewingPlace])

  const handleDeletePlace = useCallback(async (id: string) => {
    const place = places.find(p => p.id === id)
    try {
      await deletePlace(id)
    } catch (err) {
      console.error('Delete failed:', err)
      return
    }
    if (!place) return
    if (selectedPlace?.id === id) {
      setSelectedPlace(null)
      setSheetState('hidden')
      setConfirmingId(null)
    }
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current)
    setDeletedPlace(place)
    undoTimeoutRef.current = setTimeout(() => setDeletedPlace(null), 6000)
  }, [places, deletePlace, selectedPlace])

  async function handleUndoDelete() {
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current)
    if (deletedPlace) {
      try {
        await restorePlace(deletedPlace.id)
      } catch (err) {
        console.error('Restore failed:', err)
      }
    }
    setDeletedPlace(null)
  }

  async function handleAdd(data: PlaceInput) {
    const result = await addPlace(data)
    if (result) {
      setViewportBounds(null)
      setFocusPlace({ lat: result.lat, lng: result.lng })
      setNewPlaceId(result.id)
      setPopupPlaceId(result.id)
      setViewingPlace({ id: result.id, name: result.name })
      setTimeout(() => setNewPlaceId(null), 4000)
      setPanel(null)
    }
  }

  async function handleUpdate(id: string, data: PlaceInput) {
    const result = await updatePlace(id, data)
    if (result) {
      setFocusPlace({ lat: result.lat, lng: result.lng })
      setPopupPlaceId(result.id)
      setViewingPlace({ id: result.id, name: result.name })
    }
  }

  function handleSelectPlace(place: Place) {
    if (isMobile && !previousMobileArea) {
      setPreviousMobileArea({ center, radius, cityName, stateName, countryCode })
    }
    setFocusPlace({ lat: place.lat, lng: place.lng })
    if (isMobile) setViewingPlace({ id: place.id, name: place.name })
    setSelectedPlace(place)
    setSheetState('peek')
    setPanel(null)
  }

  function handleMobilePopup(placeId: string) {
    const place = places.find(p => p.id === placeId)
    if (place) handleSelectPlace(place)
  }

  const handleLocatePlace = useCallback((place: Place) => {
    setFocusPlace({ lat: place.lat, lng: place.lng })
    setViewingPlace({ id: place.id, name: place.name })
    setPanel(null)
    if (isMobile) {
      handleSelectPlace(place)
    } else {
      setPopupPlaceId(place.id)
    }
  }, [isMobile])

  function handleBackToArea() {
    if (previousMobileArea?.center) {
      setCenter(
        previousMobileArea.center.lat,
        previousMobileArea.center.lng,
        previousMobileArea.cityName,
        previousMobileArea.stateName,
        previousMobileArea.countryCode,
        previousMobileArea.radius,
      )
    } else {
      clearCenter()
    }
    setPreviousMobileArea(null)
    setViewingPlace(null)
    setSelectedPlace(null)
    setSheetState('hidden')
    setConfirmingId(null)
  }

  const handleExplorePlace = useCallback((place: Place) => {
    setPreviousMobileArea(null)
    setFocusPlace({ lat: place.lat, lng: place.lng })
    setCenter(place.lat, place.lng, place.name, '', '', EXPLORE_RADIUS_KM)
    setViewingPlace(null)
    if (!isMobile) {
      setPanel('list')
    } else {
      setSheetState('hidden')
    }
  }, [setCenter, isMobile])

  const filterRange = getFilterRange(filter)
  let filteredPlaces = matchedPlaces
  if (filterRange) {
    filteredPlaces = filteredPlaces.filter(p => {
      if (!p.date_from) return false
      const [fy, fm, fd] = p.date_from.split('-').map(Number)
      const from = new Date(fy, fm - 1, fd)
      const [ty, tm, td] = (p.date_to || p.date_from).split('-').map(Number)
      const to = new Date(ty, tm - 1, td, 23, 59, 59, 999)
      return to >= filterRange.start && from <= filterRange.end
    })
  }
  const boundsCenter: GeoPoint | null = viewportBounds && !center
    ? {
        lat: (viewportBounds.north + viewportBounds.south) / 2,
        lng: (viewportBounds.east + viewportBounds.west) / 2,
      }
    : null
  if (viewportBounds && !center && boundsCenter) {
    if (boundsRadius) {
      filteredPlaces = getPlacesWithinRadius(filteredPlaces, boundsCenter, boundsRadius)
    } else {
      filteredPlaces = getPlacesWithinBounds(filteredPlaces, viewportBounds)
    }
  }
  if (viewingPlace && !filteredPlaces.some(p => p.id === viewingPlace.id)) {
    const target = places.find(p => p.id === viewingPlace.id)
    if (target) filteredPlaces = [target, ...filteredPlaces]
  }
  if (amenityFilters.length > 0) {
    filteredPlaces = filteredPlaces.filter(p => amenityFilters.every(a => p.amenities?.includes(a)))
  }
  if (priceFilter) {
    filteredPlaces = filteredPlaces.filter(p => p.price_tier === priceFilter)
  }
  if (priorityFilter) {
    filteredPlaces = filteredPlaces.filter(p => p.priority === priorityFilter)
  }
  if (ratingFilter) {
    filteredPlaces = filteredPlaces.filter(p => p.rating === ratingFilter)
  }

  const hasActiveFilters = filter !== 'all' || amenityFilters.length > 0 || priceFilter !== null || priorityFilter !== null || ratingFilter !== null
  const contextLabels = [
    cityName,
    filter !== 'all' ? FILTERS.find(f => f.key === filter)?.label : '',
    ...amenityFilters.slice(0, 2).map(formatAmenity),
    priceFilter ? formatPriceTier(priceFilter) : '',
    priorityFilter ? `${formatPriority(priorityFilter)} priority` : '',
    ratingFilter ? `${ratingFilter}★` : '',
  ].filter(Boolean)

  function handleViewArea() {
    setViewingPlace(null)
    setFitBoundsTrigger(n => n + 1)
    setPanel('list')
  }

  function handleDismissViewing() {
    setViewingPlace(null)
  }

  function handleRecenter() {
    setViewingPlace(null)
    setFitBoundsTrigger(n => n + 1)
  }

  function handleFocusHere() {
    if (!viewportBounds) return
    const lat = (viewportBounds.north + viewportBounds.south) / 2
    const lng = (viewportBounds.east + viewportBounds.west) / 2
    const cornerDist = getDistanceKm(lat, lng, viewportBounds.north, viewportBounds.east)
    const radiusKm = Math.max(1, Math.ceil(cornerDist / 5) * 5)
    setViewingPlace(null)
    setBoundsRadius(null)
    setSuppressFit(n => n + 1)
    setFocusCenter(lat, lng, radiusKm)
  }

  if (!authed) return <AccessDenied onLogin={login} />

  return (
    <div className="app">
      <div className={`map-wrapper${loading ? ' map-loading' : ''}`}>
        <Map
          places={previewArea ? getPlacesWithinRadius(places, previewArea, radius) : filteredPlaces}
          focusPlaces={matchedPlaces}
          center={center}
          radius={radius}
          onDelete={handleDeletePlace}
          onEdit={setEditingPlace}
          focusPlace={focusPlace}
          onFocusDone={() => setFocusPlace(null)}
          newPlaceId={newPlaceId}
          popupPlaceId={popupPlaceId}
          onPopupDone={() => setPopupPlaceId(null)}
          onViewportChange={setViewportBounds}
          viewingPlace={viewingPlace}
          onViewArea={handleViewArea}
          onDismissViewing={handleDismissViewing}
          fitBoundsTrigger={fitBoundsTrigger}
          previewArea={previewArea}
          onPreviewAreaDone={() => setPreviewArea(null)}
          suppressFit={suppressFit}
          hoverRadiusKm={hoverRadiusKm}
          boundsCenter={boundsCenter}
          boundsRadius={boundsRadius}
          isMobile={isMobile}
          confirmingId={confirmingId}
          setConfirmingId={setConfirmingId}
          onMobilePopup={handleMobilePopup}
          hoverPlaceId={hoverPlaceId}
          onExplorePlace={handleExplorePlace}
        />
      </div>

      <header className="topbar">
        <div className="topbar-brand">
          <MapPin size={18} strokeWidth={2.5} />
          <span>Family Fun Map</span>
          {typeof __APP_VERSION__ !== 'undefined' && (
            <span className="version-badge">{__APP_VERSION__}</span>
          )}
        </div>
        {!isMobile && (
          <div className="topbar-search">
            <UnifiedSearchInput
              onCitySelect={(lat, lng, name, state) => { setCenter(lat, lng, name, state); setViewingPlace(null) }}
              onClear={() => { clearCenter(); setHoverRadiusKm(null); setViewingPlace(null); setSuppressFit(n => n + 1) }}
              center={center}
              stateName={stateName}
              cityName={cityName}
              radius={radius}
              onRadiusChange={(r) => { setRadius(r); setViewportBounds(null); setViewingPlace(null) }}
              viewportBounds={viewportBounds}
              boundsRadius={boundsRadius}
              onBoundsRadiusChange={(r) => { setBoundsRadius(r); setViewingPlace(null) }}
              activeFilter={filter}
              places={places}
              onLocate={handleLocatePlace}
              query={searchQuery}
              onQueryChange={setSearchQuery}
              onHoverRadius={setHoverRadiusKm}
              variant="topbar"
            />
          </div>
        )}
        <div className="topbar-actions">
          <span className="pin-count">
            {filteredPlaces.length === places.length
              ? <>{places.length} {places.length === 1 ? 'place' : 'places'}</>
              : <>{filteredPlaces.length} of {places.length} places{filter !== 'all' && ` · ${FILTERS.find(f => f.key === filter)?.label}`}{cityName && ` · ${cityName}`}</>
            }
          </span>
          <button
            className={`icon-btn${panel === 'list' ? ' active' : ''}`}
            onClick={() => {
              if (panel === 'list') {
                setPanel(null)
              } else {
                setPanel('list')
                setSheetState('hidden')
              }
            }}
            aria-label="Saved places"
            title="Saved places"
          >
            <List size={18} />
          </button>
        </div>
        <div className="mobile-topbar-summary">
          {filteredPlaces.length === places.length
            ? <>{places.length} {places.length === 1 ? 'place' : 'places'}</>
            : <>{filteredPlaces.length} of {places.length} places{filter !== 'all' && ` · ${FILTERS.find(f => f.key === filter)?.label}`}{cityName && ` · ${cityName}`}</>
          }
        </div>
      </header>

      {/* Map context pill keeps the active browse context visible above the map. */}
      {hasActiveFilters && (
        <div
          className="map-filter-chip"
        >
          <button className="map-filter-chip-main" onClick={() => isMobile ? setMobileFiltersOpen(true) : setPanel('list')} title="Show active filters" aria-label="Show active filters">
            <SlidersHorizontal size={14} />
            <span>{contextLabels.length > 0 ? contextLabels.join(' · ') : 'Active filters'}</span>
          </button>
          <button className="map-filter-chip-clear" onClick={() => { setFilter('all'); setAmenityFilters([]); setPriceFilter(null); setPriorityFilter(null); setRatingFilter(null) }} aria-label="Clear filters" title="Clear filters">
            <X size={13} />
          </button>
        </div>
      )}

      {/* Location controls — geolocation only, floats top-right */}
      <LocationControls
        isGeolocating={isGeolocating}
        onReset={() => { resetToGeolocation(); setViewportBounds(null); setViewingPlace(null) }}
        onShowAll={() => { clearCenter(); setViewportBounds(null); setViewingPlace(null); setFitBoundsTrigger(n => n + 1) }}
        onFocusHere={handleFocusHere}
      />

      {isMobile && !panel && !editingPlace && !selectedPlace && (
        <MobileExplorer
          places={filteredPlaces}
          center={center}
          cityName={cityName}
          query={browseQuery}
          onQueryChange={setBrowseQuery}
          category={mobileCategory}
          onCategoryChange={setMobileCategory}
          onSelect={handleSelectPlace}
          onNearMe={() => { setPreviousMobileArea(null); resetToGeolocation(); setViewportBounds(null); setViewingPlace(null) }}
          onOpenFilters={() => setMobileFiltersOpen(true)}
        />
      )}

      {isMobile && mobileFiltersOpen && (
        <MobileFilterSheet
          filter={filter}
          onFilterChange={setFilter}
          amenityFilters={amenityFilters}
          onAmenityFiltersChange={setAmenityFilters}
          priceFilter={priceFilter}
          onPriceFilterChange={setPriceFilter}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
          ratingFilter={ratingFilter}
          onRatingFilterChange={setRatingFilter}
          onClose={() => setMobileFiltersOpen(false)}
        />
      )}

      {/* FAB — primary action, bottom-right; desktop only (mobile adds via list panel header) */}
      {!isMobile && !panel && !editingPlace && (
        <button
          className="fab"
          onClick={() => setPanel('add')}
          aria-label="Add place"
          title="Add place"
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>
      )}

      <aside className={`side-panel${(panel || editingPlace) ? ' open' : ''}`}>
        {panel === 'add' && !editingPlace && (
          <AddPlacePanel
            key="add"
            onAdd={handleAdd}
            onClose={() => { setPanel(null); setPreviewArea(null) }}
            cityName={cityName}
            stateName={stateName}
            countryCode={countryCode}
            initialQuery={searchQuery}
            onShowInMap={(coords) => setPreviewArea(coords)}
          />
        )}
        {panel === 'list' && !editingPlace && (
          <div className="panel">
            <div className="panel-header">
              <h2>Saved places</h2>
              <div className="panel-header-right">
                <button className="icon-btn panel-add-btn" onClick={() => setPanel('add')} title="Add place">
                  <Plus size={18} />
                </button>
                <ExportButton />
                <button className="icon-btn" onClick={() => setPanel(null)}>
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="panel-body">
              <PlacesList
                places={filteredPlaces}
                onDelete={handleDeletePlace}
                onEdit={setEditingPlace}
                onLocate={handleLocatePlace}
                activeFilter={filter}
                center={center}
                stateName={stateName}
                cityName={cityName}
                radius={radius}
                onRadiusChange={(r) => { setRadius(r); setViewportBounds(null); setViewingPlace(null) }}
                onCitySelect={(lat, lng, name, state) => { setCenter(lat, lng, name, state); setViewingPlace(null) }}
                onClear={() => { clearCenter(); setHoverRadiusKm(null); setViewingPlace(null); setSuppressFit(n => n + 1) }}
                onRecenter={handleRecenter}
                viewingPlace={viewingPlace}
                onClearViewing={() => { setViewingPlace(null); setFitBoundsTrigger(n => n + 1) }}
                filter={filter}
                onFilterChange={setFilter}
                viewportBounds={viewportBounds}
                onClearBounds={() => { setViewportBounds(null); setFitBoundsTrigger(n => n + 1) }}
                boundsRadius={boundsRadius}
                onBoundsRadiusChange={(r) => { setBoundsRadius(r); setViewingPlace(null) }}
                onClearBoundsRadius={() => setBoundsRadius(null)}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onHoverRadius={setHoverRadiusKm}
                onHoverPlace={setHoverPlaceId}
                amenityFilters={amenityFilters}
                onAmenityFiltersChange={setAmenityFilters}
                priceFilter={priceFilter}
                onPriceFilterChange={setPriceFilter}
                priorityFilter={priorityFilter}
                onPriorityFilterChange={setPriorityFilter}
                ratingFilter={ratingFilter}
                onRatingFilterChange={setRatingFilter}
              />
            </div>
          </div>
        )}
        {editingPlace && (
          <AddPlacePanel
            key={editingPlace.id}
            editPlace={editingPlace}
            onUpdate={handleUpdate}
            onClose={() => { setEditingPlace(null); setPanel(null); setPreviewArea(null) }}
            cityName={cityName}
            stateName={stateName}
            countryCode={countryCode}
            initialQuery={searchQuery}
            onShowInMap={(coords) => setPreviewArea(coords)}
          />
        )}
      </aside>

      {isMobile && selectedPlace && (
        <BottomSheet
          place={selectedPlace}
          sheetState={sheetState}
          onSheetChange={setSheetState}
          onEdit={(place) => {
            setEditingPlace(place)
            setPanel('add')
            setSelectedPlace(null)
            setSheetState('hidden')
            setConfirmingId(null)
          }}
          onDelete={handleDeletePlace}
          confirmingId={confirmingId}
          onConfirmingChange={setConfirmingId}
          onClose={() => {
            setSelectedPlace(null)
            setSheetState('hidden')
            setConfirmingId(null)
          }}
          onBackToArea={handleBackToArea}
          canGoBackToArea={previousMobileArea !== null}
          onExplore={handleExplorePlace}
        />
      )}

      {deletedPlace && (
        <Toast
          name={deletedPlace.name}
          onUndo={handleUndoDelete}
          onDismiss={() => setDeletedPlace(null)}
        />
      )}
    </div>
  )
}
