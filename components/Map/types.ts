export type MapMarker = {
  id: string;
  title: string;
  description?: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
};
