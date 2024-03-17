import { useFetcher, useParams, useSearchParams } from "@remix-run/react";
import { useEffect } from "react";

/**
 * Renders a social network view on entities and their relationships
 */
export function NetworkView() {
    const fetcher = useFetcher();
    const params = useParams();

    useEffect(() => {
        fetcher.load(`/person/network?id=${params.id}`);
    }, []);
    
    return (            
        <div className="w-full h-full text-white relative bg-slate-800">
            this is a network view placeholder {
                JSON.stringify(fetcher.data, null, 2)
            }
        </div>
    );
}