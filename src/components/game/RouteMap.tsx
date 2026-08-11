/**
 * Drop-in para la tab "Ruta" en Game.tsx:
 *   {activeTab === 'ruta' && <RouteMap cpsTotal={store.cpsTotal} />}
 *
 * La UI viva (eventos + desafíos + timeline) vive en NationalMapPanel.
 * No hace falta tocar Game.tsx mientras se mantenga este reexport.
 */
export { NationalMapPanel as RouteMap } from './NationalMapPanel';
