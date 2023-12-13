import {Resvg} from '@resvg/resvg-js'
import type {SatoriOptions} from 'satori'
import satori from 'satori'
import fs from 'fs'
import { Person, Class, Programme, Publication } from './Icons';
import { HorizontalLogo } from './logo_horizontal';
import { getPlural } from '../entityTypes';
import { capitalize } from '../lang';
import { getFacultyColor } from '../colors';

const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;

// Load the font from the "public" directory

const fontCache = new Map<string, Promise<Buffer>>()

async function getFont(fontName: string) {
  if (fontCache.has(fontName)) {
    return fontCache.get(fontName)
  }

  const fontPath = `${__dirname}/../app/utils/ogImage/fonts/${fontName}`
  const fontPromise = fs.promises.readFile(fontPath)
  fontCache.set(fontName, fontPromise)
  return fontPromise
}

export async function createOGImage({
  title,
  subtitle,
  faculty,
  entities,
}) {
  const options: SatoriOptions = {
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    fonts: [
      {
        name: 'Inter',
        data: await getFont('Inter/Inter-Regular.ttf'),
        style: 'normal',
      },
    ],
  }

  const color = getFacultyColor(faculty.id)

  const svg = await satori(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: `linear-gradient(90deg, ${color} 0%, ${color} 3%, rgba(255,255,255,1) 3%)`, 
        fontSize: 64,
        color: '#34393F',
      }}
    >
  <div style={{height: "10%"}}></div>
  <div style={{marginLeft: "8%", fontWeight: 600, maxWidth: '90%', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
    {title}
  </div>
  <div style={{height: "3%"}}></div>
  <div style={{marginLeft: "8%", fontSize: '40', color: '#6F757F'}}>
    { subtitle }
  </div>
  <div style={{height: "10%"}}></div>
  <div style={{paddingLeft: "8%", paddingRight: "15%", display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
    {
      Object.entries(entities).sort((a,b) => b[1] - a[1]).map(([key, value]) => {
        return (
          <div style={{
            display:'flex',
            flexDirection: 'row'
          }}>
            <div style={{fontSize:50, display: 'flex'}}>
              {
                key === 'people' ? <Person /> : key === 'classes' ? <Class />  : key === 'programmes' ? <Programme /> : <Publication />
              }
            </div>
            <div style={{display: 'flex', flexDirection: 'column', paddingLeft: '20px'}}>
              <div style={{fontSize:50, display: 'flex'}}>{value}</div>
              <div style={{fontSize:40, color: '#6F757F', display: 'flex'}}>{
                capitalize(key, value)
              }</div>
            </div>   
          </div>
        )
      })
    }
  </div>
  <div style={{flex: 1}}></div>
  <div style={{display:'flex', flexDirection: 'row', paddingBottom: '5%'}}>
    <div style={{flex: 1}}>
    </div>
    <div style={{width: '30%', display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', paddingRight: '8%'}}>
      <HorizontalLogo />
    </div>
  </div>
</div>,
    options
  )

  // Convert the SVG to PNG with "resvg"
  const resvg = new Resvg(svg)
  const pngData = resvg.render()
  return pngData.asPng()
}