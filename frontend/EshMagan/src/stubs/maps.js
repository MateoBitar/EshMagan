// src/stubs/maps.js - stub for web build
// react-native-maps is native-only; web uses Leaflet directly in EvacuationScreen
import React from 'react';
import { View } from 'react-native';

const MapView = ({ children, style }) => React.createElement(View, { style }, children);
const Marker = () => null;
const Polyline = () => null;
const Callout = () => null;
const Circle = () => null;
const Polygon = () => null;
const PROVIDER_GOOGLE = 'google';
const PROVIDER_DEFAULT = null;

export { Marker, Polyline, Callout, Circle, Polygon, PROVIDER_GOOGLE, PROVIDER_DEFAULT };
export default MapView;