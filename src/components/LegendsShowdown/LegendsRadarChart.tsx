import { useState, useRef, useEffect } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  ALL_RADAR_PLAYERS_FORMATTED,
  buildMultiFormatRadarData,
  type CricketFormat,
  type LegendFullProfile,
} from '../../data/legendsComparisonData';
import './LegendsRadarChart.css';

const FORMATS: CricketFormat[] = ['ODI', 'TEST', 'T20I'];

export default function LegendsRadarChart() {
  // Active Format State
  const [activeFormat, setActiveFormat] = useState<CricketFormat>('ODI');

  // Selected Player IDs (Default: Kohli & Sachin)
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(['kohli', 'sachin']);

  // Autocomplete Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  // Close autocomplete on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
        setIsAutocompleteOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter selected profiles
  const selectedPlayers: LegendFullProfile[] = selectedPlayerIds
    .map((id) => ALL_RADAR_PLAYERS_FORMATTED.find((p) => p.id === id))
    .filter((p): p is LegendFullProfile => Boolean(p));

  // Available players for search (not yet selected)
  const unselectedPlayers = ALL_RADAR_PLAYERS_FORMATTED.filter(
    (p) => !selectedPlayerIds.includes(p.id)
  );

  const filteredSuggestions = unselectedPlayers.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddPlayer = (playerId: string) => {
    if (!selectedPlayerIds.includes(playerId) && selectedPlayerIds.length < 6) {
      setSelectedPlayerIds([...selectedPlayerIds, playerId]);
    }
    setSearchQuery('');
    setIsAutocompleteOpen(false);
  };

  const handleRemovePlayer = (playerId: string) => {
    if (selectedPlayerIds.length > 1) {
      setSelectedPlayerIds(selectedPlayerIds.filter((id) => id !== playerId));
    }
  };

  const radarData = buildMultiFormatRadarData(selectedPlayers, activeFormat);

  return (
    <div className="legends-radar-container glass-card">
      {/* Top Header Row */}
      <div className="radar-header">
        <div className="radar-header-left">
          <div className="radar-title-row">
            <h3 className="radar-title">Multi-Dimensional Skill Matrix</h3>
            <span className="format-badge-indicator">{activeFormat} Format</span>
          </div>
          <p className="radar-subtitle">
            Compare multiple legends simultaneously across 6 core batting dimensions (normalized 0–100 scale).
          </p>
        </div>

        {/* Format Toggle Pill Tabs */}
        <div className="format-toggle-pills">
          <span className="format-toggle-label">Format:</span>
          {FORMATS.map((fmt) => (
            <button
              key={fmt}
              className={`format-pill-btn ${activeFormat === fmt ? 'active' : ''}`}
              onClick={() => setActiveFormat(fmt)}
            >
              {fmt}
            </button>
          ))}
        </div>
      </div>

      {/* Multi-Player Controls Row: Search + Active Tags */}
      <div className="multi-player-controls-row">
        {/* Search Bar with Autocomplete */}
        <div className="search-autocomplete-wrapper" ref={searchWrapperRef}>
          <div className="search-input-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="player-search-input"
              placeholder={
                unselectedPlayers.length > 0
                  ? "Add player (e.g. 'Root', 'Smith', 'Rohit')..."
                  : "All players added"
              }
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsAutocompleteOpen(true);
              }}
              onFocus={() => setIsAutocompleteOpen(true)}
              disabled={unselectedPlayers.length === 0}
            />
          </div>

          {/* Autocomplete Dropdown List */}
          {isAutocompleteOpen && filteredSuggestions.length > 0 && (
            <ul
              className="autocomplete-dropdown-list"
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              {filteredSuggestions.map((player) => (
                <li
                  key={player.id}
                  className="autocomplete-item"
                  onClick={() => handleAddPlayer(player.id)}
                >
                  <span className="item-flag">{player.flag}</span>
                  <span className="item-name">{player.name}</span>
                  <span className="item-country">({player.country})</span>
                  <span className="add-plus-badge" style={{ color: player.color }}>
                    + Add
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Active Player Tags / Removable Pills */}
        <div className="active-player-tags-container">
          {selectedPlayers.map((player) => (
            <div
              key={player.id}
              className="active-player-tag"
              style={{
                borderColor: player.color,
                backgroundColor: player.color + '15',
              }}
            >
              <span className="tag-dot" style={{ backgroundColor: player.color }} />
              <span className="tag-flag">{player.flag}</span>
              <span className="tag-name" style={{ color: player.color }}>
                {player.shortName}
              </span>
              {selectedPlayers.length > 1 && (
                <button
                  className="tag-remove-btn"
                  onClick={() => handleRemovePlayer(player.id)}
                  title={`Remove ${player.name}`}
                  aria-label={`Remove ${player.name}`}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Radar Visual + Dynamic Table Layout */}
      <div className="radar-visual-layout">
        <div className="radar-chart-wrapper">
          <ResponsiveContainer width="100%" height={380}>
            <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <PolarGrid stroke="rgba(255, 255, 255, 0.08)" />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fill: '#F0F0F8', fontFamily: 'Rajdhani', fontSize: 13, fontWeight: 600 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(8, 8, 18, 0.95)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '0.6rem',
                  fontFamily: 'Rajdhani',
                  fontSize: '0.85rem',
                  color: '#F0F0F8',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                }}
                formatter={(value: any, name: any, item: any) => {
                  const player = selectedPlayers.find((p) => p.name === name);
                  const rawVal = player ? item.payload[`${player.id}_raw`] : value;
                  return [`${rawVal} (${value}/100)`, name];
                }}
              />

              {/* Dynamic Radar Shapes for all active players */}
              {selectedPlayers.map((player) => (
                <Radar
                  key={player.id}
                  name={player.name}
                  dataKey={`${player.id}_norm`}
                  stroke={player.color}
                  fill={player.color}
                  fillOpacity={0.2 + (selectedPlayers.length === 1 ? 0.2 : 0)}
                  strokeWidth={player.id === 'kohli' ? 2.5 : 2}
                  animationDuration={700}
                  animationEasing="cubic-bezier(0.16, 1, 0.3, 1)"
                />
              ))}
            </RadarChart>
          </ResponsiveContainer>

          {/* Color Legend Keys */}
          <div className="radar-legend-keys">
            {selectedPlayers.map((player) => (
              <div key={`key-${player.id}`} className="key-item" style={{ color: player.color }}>
                <span className="key-dot" style={{ backgroundColor: player.color }} />
                <span>
                  {player.flag} {player.shortName}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Raw Data Comparison Table */}
        <div className="raw-stats-table-wrapper">
          <div className="table-header-row">
            <h4 className="table-title">Raw {activeFormat} Statistics</h4>
            <span className="table-format-tag">{activeFormat} ONLY</span>
          </div>

          <div className="table-scroll-container">
            <table className="raw-stats-table">
              <thead>
                <tr>
                  <th>Dimension</th>
                  {selectedPlayers.map((player) => (
                    <th key={`th-${player.id}`} style={{ color: player.color }}>
                      {player.flag} {player.shortName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {radarData.map((row) => (
                  <tr key={row.dimension}>
                    <td className="row-dim">{row.dimension}</td>
                    {selectedPlayers.map((player) => (
                      <td
                        key={`cell-${row.dimension}-${player.id}`}
                        className="row-stat-val"
                        style={{ color: player.color }}
                      >
                        {row[`${player.id}_raw`]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="table-note">
            *All figures are strictly <strong>{activeFormat}</strong> format statistics. Normalized 0–100 against format benchmarks.
          </p>
        </div>
      </div>
    </div>
  );
}
