import { useEffect, useState } from "react";
import axios from "axios";
import { Map } from "./components/organisms";
import { Participant } from "./components/types";

const App = () => {
  const [participantList, setParticipantList] = useState<Participant[]>([]);

  useEffect(() => {
    (async () => {
      const { REACT_APP_SPREAD_SHEET_ID, REACT_APP_GOOGLE_API_KEY } =
        process.env;
      if (!REACT_APP_SPREAD_SHEET_ID || !REACT_APP_GOOGLE_API_KEY) return null;

      const { data } = await axios.get<{ values: string[] }>(
        `https://sheets.googleapis.com/v4/spreadsheets/${REACT_APP_SPREAD_SHEET_ID}/values/A:C?key=${REACT_APP_GOOGLE_API_KEY}`
      );

      const header = data.values.shift();
      const [nameIndex, addressIndex, postalCodeIndex] = [
        header?.indexOf("name"),
        header?.indexOf("address"),
        header?.indexOf("postalCode"),
      ];

      if (
        nameIndex === -1 ||
        nameIndex === undefined ||
        addressIndex === -1 ||
        addressIndex === undefined ||
        postalCodeIndex === -1 ||
        postalCodeIndex === undefined
      ) {
        alert(
          "スプレッドシートのヘッダーにname, address, postalCodeが含まれているか確認してください"
        );
        throw new Error(
          "nameIndex or addressIndex or postalCodeIndex is undefined"
        );
      }

      setParticipantList(
        data.values.map((value, index) => {
          const [name, address, postalCode] = [
            value[nameIndex],
            value[addressIndex],
            value[postalCodeIndex],
          ];
          return { id: index, name, address, postalCode };
        })
      );
    })();
  }, []);

  return (
    <div className="py-8 app">
      <div className="px-8 pb-6 text-3xl">最も遠いところから来た人選手権</div>
      {participantList.length > 0 && <Map participantList={participantList} />}
    </div>
  );
};

export default App;
