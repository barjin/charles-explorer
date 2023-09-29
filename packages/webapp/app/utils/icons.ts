import { TbSchool } from 'react-icons/tb';
import { BsPerson } from 'react-icons/bs';
import { BiBookmark } from 'react-icons/bi';
import { RiSchoolLine } from 'react-icons/ri';
import { type entityTypes } from './entityTypes';
import { type IconType } from 'react-icons';

/**
 * A map of entity types to their respective icons.
 */
export const CategoryIcons: Record<entityTypes, IconType> = {
    class: TbSchool,
    person: BsPerson,
    publication: BiBookmark,
    programme: RiSchoolLine,
}