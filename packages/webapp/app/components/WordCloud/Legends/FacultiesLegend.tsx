import { useTranslation } from "react-i18next";
import { getFacultyColor } from "~/utils/colors";
import { localize } from "~/utils/lang";

export function FacultiesLegend({ faculties }: { faculties: any[] }) {
    const { i18n: { language: lang } } = useTranslation();

    return faculties.length > 0 && (
        <div className="flex flex-col justify-center bg-white rounded-md p-5 shadow-sm">
            {
                faculties.map((faculty: any) => (
                    <div className="mt-1" key={faculty.id}>
                        <div className="flex items-center">
                            <div 
                                className="w-3 h-3 rounded-full mr-3"
                                style={{ backgroundColor: getFacultyColor(faculty.id) }}    
                            ></div>
                            <span>
                                {localize(faculty.names, { lang })}
                            </span>
                        </div>
                    </div>
                ))
            }
        </div>
    )
}
