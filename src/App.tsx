import { useState, useEffect, useCallback, useRef } from 'react'
import { MapPin, List, Plus, X, Search, SlidersHorizontal, Compass } from 'lucide-react'
import Map from './components/Map'
import AddPlacePanel from './components/AddPlacePanel'
import PlacesList from './components/PlacesList'
import TripsPanel from './components/TripsPanel'
import AddToTripModal from './components/AddToTripModal'
import BottomSheet from './components/BottomSheet'
import BackToAreaButton from './components/BackToAreaButton'
import UnifiedSearchInput from './components/UnifiedSearchInput'
import ExportButton from './components/ExportButton'
import LocationControls from './components/LocationControls'
import MobileExplorer from './components/MobileExplorer'
import MobileFilterSheet from './components/MobileFilterSheet'
import FilterChip from './components/FilterChip'
import RadiusSelector from './components/RadiusSelector'
import AccessDenied from './components/AccessDenied'
import Toast from './components/Toast'
import { usePlaces } from './hooks/usePlaces'
import { useTrips } from './hooks/useTrips'
import { useAuth } from './hooks/useAuth'
import { useMapFocus } from './hooks/useMapFocus'
import { useIsMobile } from './hooks/useIsMobile'
import { FILTERS, getFilterRange } from './lib/filters'
import { formatAmenity, formatPriceTier, formatPriority } from './lib/placeAttributes'
import { getPlacesWithinBounds, getPlacesWithinRadius, getDistanceKm } from './lib/geo'
import './index.css'
import type { ActiveFilterChip, FilterKey, GeoPoint, MapBounds, PanelState, Place, PlaceCategory, PlaceInput, SheetState, ViewingPlace, PriceTier, PriorityLevel } from './types'

const EXPLORE_RADIUS_KM = 5

export default function App() {
  const { authed, login } = useAuth()
  const { places, loading, addPlace, deletePlace, restorePlace, updatePlace, uploadPlacePhoto, deletePlacePhoto } = usePlaces()
  const { trips, addTrip, editTrip, deleteTrip, addPlaceToTrip, removePlaceFromTrip, togglePlaceInTrip } = useTrips()
  const { center, radius, cityName, stateName, countryCode, matchedPlaces, isGeolocating, setCenter, setRadius, setFocusCenter, clearCenter, resetToGeolocation } = useMapFocus(places)
  const isMobile = useIsMobile()
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [panel, setPanel] = useState<PanelState>(null)
  const [activeTripId, setActiveTripId] = useState<string | null>(null)
  const [tripModalPlace, setTripModalPlace] = useState<Place | null>(null)
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
  const [radiusMenuOpen, setRadiusMenuOpen] = useState(false)
  const undoTimeoutRef = useRef<number | null>(null)

  useEffect(() => () => { if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current) }, [])

  useEffect(() => {
    if (!radiusMenuOpen) return
    const timeout = window.setTimeout(() => setRadiusMenuOpen(false), 10000)
    return () => window.clearTimeout(timeout)
  }, [radiusMenuOpen])

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

  async function handleAdd(data: PlaceInput, photo?: File | null) {
    const result = await addPlace(data)
    if (result) {
      if (photo) {
        try {
          const photoUrl = await uploadPlacePhoto(result.id, photo)
          await updatePlace(result.id, { ...data, photo_url: photoUrl })
        } catch (err) {
          console.error('Photo upload failed:', err)
        }
      }
      setViewportBounds(null)
      setFocusPlace({ lat: result.lat, lng: result.lng })
      setNewPlaceId(result.id)
      setPopupPlaceId(result.id)
      setViewingPlace({ id: result.id, name: result.name })
      setTimeout(() => setNewPlaceId(null), 4000)
      setPanel(null)
    }
  }

  async function handleUpdate(id: string, data: PlaceInput, photo?: File | null, removePhoto = false) {
    let finalData = data
    const existing = places.find(p => p.id === id)
    if (removePhoto) {
      finalData = { ...data, photo_url: null }
      if (existing?.photo_url) {
        deletePlacePhoto(existing.photo_url).catch(err => console.error('Photo delete failed:', err))
      }
    } else if (photo) {
      finalData = { ...data, photo_url: await uploadPlacePhoto(id, photo) }
      if (existing?.photo_url) {
        deletePlacePhoto(existing.photo_url).catch(err => console.error('Photo delete failed:', err))
      }
    }
    const result = await updatePlace(id, finalData)
    if (result) {
      setFocusPlace({ lat: result.lat, lng: result.lng })
      setPopupPlaceId(result.id)
      setViewingPlace({ id: result.id, name: result.name })
    }
  }

  function handleSelectPlace(place: Place) {
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

  const handleExplorePlace = useCallback((place: Place) => {
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

  const activeTrip = trips.find(t => t.id === activeTripId) || null
  if (activeTrip) {
    filteredPlaces = filteredPlaces.filter(p => activeTrip.place_ids.includes(p.id))
  }

  const hasActiveFilters = filter !== 'all' || amenityFilters.length > 0 || priceFilter !== null || priorityFilter !== null || ratingFilter !== null || activeTripId !== null
  const contextLabels = [
    activeTrip ? `Trip: ${activeTrip.name}` : '',
    cityName || (center ? 'Nearby' : ''),
    center ? `${radius} km` : '',
    filter !== 'all' ? FILTERS.find(f => f.key === filter)?.label : '',
    ...amenityFilters.slice(0, 2).map(formatAmenity),
    priceFilter ? formatPriceTier(priceFilter) : '',
    priorityFilter ? `${formatPriority(priorityFilter)} priority` : '',
    ratingFilter ? `${ratingFilter}★` : '',
  ].filter(Boolean)
  const areaFilter: ActiveFilterChip | null = activeTrip ? {
    type: 'viewing',
    label: `🚗 Trip: ${activeTrip.name} (${activeTrip.place_ids.length})`,
    onClear: () => { setActiveTripId(null); setFitBoundsTrigger(n => n + 1) },
    onRecenter: () => setFitBoundsTrigger(n => n + 1),
  } : center ? {
    type: 'city',
    label: cityName ? `📍 ${cityName} · ${radius} km` : `📍 ${radius} km radius`,
    onClear: () => { clearCenter(); setHoverRadiusKm(null); setViewingPlace(null); setSuppressFit(n => n + 1) },
    onHover: (hover) => setHoverRadiusKm(hover ? radius : null),
    onRecenter: handleRecenter,
  } : viewportBounds ? {
    type: 'bounds',
    label: boundsRadius ? `Within ${boundsRadius} km` : 'Current map view',
    onClear: boundsRadius ? () => { setBoundsRadius(null); setHoverRadiusKm(null) } : () => { setViewportBounds(null); setFitBoundsTrigger(n => n + 1) },
    onHover: boundsRadius ? (hover) => setHoverRadiusKm(hover ? boundsRadius : null) : undefined,
  } : null

  function handleViewArea() {
    setViewingPlace(null)
    setFitBoundsTrigger(n => n + 1)
    if (isMobile) {
      setSelectedPlace(null)
      setSheetState('hidden')
      setConfirmingId(null)
    } else {
      setPanel('list')
    }
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
          onAddToTrip={(place) => setTripModalPlace(place)}
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
        {isMobile && !mobileSearchOpen && (
          <button
            className="icon-btn mobile-search-toggle"
            onClick={() => setMobileSearchOpen(true)}
            aria-label="Search"
            title="Search"
          >
            <Search size={18} />
          </button>
        )}
        <div className={`topbar-search${mobileSearchOpen ? '' : ' topbar-search--collapsed'}`}>
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
            autoFocus={mobileSearchOpen}
            onFocusChange={(focused) => { if (!focused && !searchQuery) setMobileSearchOpen(false) }}
          />
        </div>
        <div className="topbar-right">
          <div className="topbar-chips">
            <span className="pin-count">
              {filteredPlaces.length === places.length
                ? <>{places.length} {places.length === 1 ? 'place' : 'places'}</>
                : <>{filteredPlaces.length} of {places.length} places{filter !== 'all' && ` · ${FILTERS.find(f => f.key === filter)?.label}`}{cityName && ` · ${cityName}`}</>
              }
            </span>
            {areaFilter && (
              <div className="header-radius-menu">
                <FilterChip f={{ ...areaFilter, onRecenter: () => setRadiusMenuOpen(open => !open) }} />
                {radiusMenuOpen && (
                  <div className="header-radius-popover">
                    <span>Radius</span>
                    <RadiusSelector
                      value={center ? radius : boundsRadius ?? radius}
                      onChange={(value) => {
                        if (center) {
                          setRadius(value)
                          setViewportBounds(null)
                          setViewingPlace(null)
                        } else {
                          setBoundsRadius(value)
                        }
                        setRadiusMenuOpen(false)
                      }}
                      onHover={setHoverRadiusKm}
                    />
                  </div>
                )}
              </div>
            )}
            {hasActiveFilters && (
              <button className="topbar-context" onClick={() => isMobile ? setMobileFiltersOpen(true) : setPanel('list')} title="Show active filters">
                <SlidersHorizontal size={14} />
                <span>{contextLabels.filter(label => label && !label.includes('km') && label !== cityName).join(' · ') || 'Filters'}</span>
              </button>
            )}
          </div>
          <div className="topbar-actions">
            <span className="mobile-topbar-summary">
              {filteredPlaces.length === places.length
                ? `${places.length} ${places.length === 1 ? 'place' : 'places'}`
                : `${filteredPlaces.length} of ${places.length} places`}
            </span>
            <button
              className={`icon-btn${panel === 'trips' ? ' active' : ''}`}
              onClick={() => {
                if (panel === 'trips') {
                  setPanel(null)
                } else {
                  setPanel('trips')
                  setSheetState('hidden')
                }
              }}
              aria-label="Next trips"
              title="Next trips"
            >
              <Compass size={18} />
              {trips.length > 0 && <span className="topbar-badge">{trips.length}</span>}
            </button>
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
        </div>
      </header>

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
          onNearMe={() => { resetToGeolocation(); setViewportBounds(null); setViewingPlace(null) }}
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
        {panel === 'trips' && !editingPlace && (
          <TripsPanel
            trips={trips}
            places={places}
            activeTripId={activeTripId}
            onSelectTrip={trip => {
              setActiveTripId(trip ? trip.id : null)
            }}
            onAddTrip={addTrip}
            onUpdateTrip={editTrip}
            onDeleteTrip={async id => {
              await deleteTrip(id)
              if (activeTripId === id) setActiveTripId(null)
            }}
            onAddPlaceToTrip={addPlaceToTrip}
            onRemovePlaceFromTrip={removePlaceFromTrip}
            onLocatePlace={handleLocatePlace}
            onClose={() => setPanel(null)}
            onFocusTripOnMap={trip => {
              setActiveTripId(trip.id)
              setFitBoundsTrigger(n => n + 1)
              setViewingPlace(null)
              if (isMobile) {
                setPanel(null)
                setSheetState('hidden')
              }
            }}
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
                onAddToTrip={(place) => setTripModalPlace(place)}
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
          onExplore={handleExplorePlace}
          onAddToTrip={(place) => setTripModalPlace(place)}
        />
      )}

      {tripModalPlace && (
        <AddToTripModal
          place={tripModalPlace}
          trips={trips}
          onToggleTripPlace={togglePlaceInTrip}
          onCreateTrip={addTrip}
          onClose={() => setTripModalPlace(null)}
        />
      )}

      {isMobile && viewingPlace && (
        <BackToAreaButton
          viewingPlace={viewingPlace}
          onViewArea={handleViewArea}
          onDismissViewing={handleDismissViewing}
          className={`mobile-map-reset mobile-map-reset--${sheetState}`}
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
