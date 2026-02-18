import { Render } from "@measured/puck";
import { puckConfig } from "./puck.config";
import { injectFieldsIntoPuckData } from "../utils/puckFields";

export default function PuckRenderer({ data, fields = {} }) {
    if (!data || !data.content) return null;

    const renderData = injectFieldsIntoPuckData(data, fields);

    return (
        <div className="puck-preview-container bg-white">
            <Render config={puckConfig} data={renderData} />
        </div>
    );
}
