import { useState } from "react";
import GoogleMapReact from "google-map-react";
import { faLocationPin } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as geolib from "geolib";
import maxBy from "lodash/maxBy";
import { LatLng, Participant } from "../types";
import { pointList as pointListFixture } from "../../fixtures";

const Pin = ({ name }: { lat: number; lng: number; name?: string }) => (
  <div className="absolute left-[-100px] top-[-70px]">
    <div className="flex flex-col items-center w-[200px] h-[100px]">
      <div className=" bg-white min-w-max px-2 py-1 mb-1 rounded-md text-center shadow-md">
        {name}さん
      </div>
      <FontAwesomeIcon
        icon={faLocationPin}
        size="4x"
        color="#ff0000"
        className=""
      />
    </div>
  </div>
);

type Props = {
  participantList: Participant[];
};

export const Map = ({ participantList }: Props) => {
  // 無駄な課金を防ぐために開発中にfixtureを使うかどうか
  const saveAPIResource = true;

  // 道の駅 とんやの郷
  const MICHINOEKI_TONYA = { lat: 37.605067, lng: 140.672533 };
  const defaultCenter = MICHINOEKI_TONYA;

  const [mostFarParticipant, setMostFarParticipant] = useState<
    Participant & { distance: number }
  >();
  const [pointList, setPointList] = useState<
    { id: number; location: LatLng }[]
  >(saveAPIResource ? pointListFixture : []);

  const [center, setCenter] = useState<LatLng>();

  const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;

  if (!apiKey) return null;

  const onGoogleApiLoaded = async () => {
    setCenter({ lat: 35.974649, lng: 139.598878 });

    // 料金節約のためにsaveAPIResourceがtrueのときはAPIを叩かない
    if (!saveAPIResource) {
      const geocoder = new google.maps.Geocoder();
      const resArray = await Promise.all(
        participantList.map(({ postalCode }) =>
          geocoder.geocode({ address: postalCode.toString() })
        )
      );
      const newPointList = resArray.map((res, index) => {
        const { lat, lng } = res.results[0].geometry.location;
        const participant = participantList[index];

        return { id: participant.id, location: { lat: lat(), lng: lng() } };
      });

      setPointList(newPointList);
    }

    const mostFarPoint = maxBy(
      pointList.map((point) => ({
        id: point.id,
        distance: geolib.getDistance(MICHINOEKI_TONYA, point.location),
      })),
      (p) => p.distance
    );

    if (!mostFarPoint) {
      throw new Error("mostFarPoint is undefined");
    }

    setMostFarParticipant({
      ...participantList.find((p) => p.id === mostFarPoint.id)!,
      distance: mostFarPoint.distance,
    });
  };

  return (
    <div className="h-[1000px]  w-full pb-4">
      {mostFarParticipant && (
        <div className="px-8 text-xl mb-4">
          最も遠いところから来た参加者は、{mostFarParticipant.address}
          から直線距離
          {Math.round(mostFarParticipant.distance / 1000)}kmの
          {mostFarParticipant.name}さんです！
        </div>
      )}
      <GoogleMapReact
        options={{ disableDefaultUI: true, rotateControl: false }}
        bootstrapURLKeys={{ key: apiKey }}
        defaultZoom={10}
        defaultCenter={defaultCenter}
        center={center}
        onGoogleApiLoaded={onGoogleApiLoaded}
        yesIWantToUseGoogleMapApiInternals
      >
        {pointList.map((point) => (
          <Pin
            lat={point.location.lat}
            lng={point.location.lng}
            name={participantList.find((p) => p.id === point.id)?.name}
            key={point.id}
          />
        ))}
      </GoogleMapReact>
    </div>
  );
};
