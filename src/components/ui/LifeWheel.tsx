import { useLayoutEffect, useState, useRef, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Download, ClipboardCopy, CircleX, CircleCheck, CircleDashed } from 'lucide-react';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy'
import * as am5radar from '@amcharts/amcharts5/radar';
import * as am5exporting from "@amcharts/amcharts5/plugins/exporting";
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import am5themes_Material from '@amcharts/amcharts5/themes/Material';
import { debounce } from 'lodash';

import ErrorBoundary from './ErrorBoundary';

// Types and Interfaces
interface CategoryData {
  category: string;
  value: number;
  columnSettings: {
    fill: am5.Color;
    opacity: number;
  };
  index: number;
}
/*interface SeriesDataItem extends CategoryData {
  dataContext?: CategoryData;
}*/

interface ChartState {
  downloadBtnDisabled: boolean;
  clipboardBtnState: number;
  clipboardBtnText: string;
}

interface ChartRefs {
  series: am5radar.RadarColumnSeries;
  seriesHover: am5radar.RadarColumnSeries;
  xAxis: am5xy.CategoryAxis<am5xy.AxisRenderer>;
  yAxis: am5xy.ValueAxis<am5xy.AxisRenderer>;
}

type ChartClickEventType = {
  point: { x: number; y: number };
  target: {
    getPrivate: (key: string) => number;
  };
};


// Constants
const CATEGORIES = [
  "Helse",
  "Jobb",
  "Kjærlighet",
  "Personlig utvikling",
  "Venner og familie",
  "Økonomi",
  "Moro og avkobling",
  "Hjem og omgivelser"
];
const CATEGORIES_SHORT = [
  "Helse",
  "Jobb",
  "Kjærlighet",
  "Utvikling",
  "Venner/fam.",
  "Økonomi",
  "Moro",
  "Hjem"
];

const COLORS = [
  "#4267b6",
  "#7ED321",
  "#c93939",
  "#e48820",
  "#e6e34a",
  "#3c801c",
  "#a346a7",
  "#3dbead"
];


const INITIAL_CHART_STATE: ChartState = {
  downloadBtnDisabled: false,
  clipboardBtnState: 0,
  clipboardBtnText: 'Kopier til utklippstavle'
};

const COLOR_SET = COLORS.map(color => am5.color(color));
const INITIAL_DATA = CATEGORIES.map((category, index) => ({
  category,
  categoryShort: CATEGORIES_SHORT[index],
  value: 0,
  columnSettings: {
    fill: COLOR_SET[index],
    opacity: 0.8
  },
  index
}));

// Utility Functions
const base64ToBlob = (base64: string): Blob => {
  const byteString = window.atob(base64);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const int8Array = new Uint8Array(arrayBuffer);
  
  for (let i = 0; i < byteString.length; i++) {
    int8Array[i] = byteString.charCodeAt(i);
  }
  
  return new Blob([int8Array], { type: 'image/png' });
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Custom Hooks
const useChartPerformance = () => {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      console.debug(`Chart render time: ${endTime - startTime}ms`);
    };
  }, []);
};

const useChartHandlers = (chartRefs: React.MutableRefObject<ChartRefs | null>) => {
  const lastHoverDataIndexRef = useRef<number>(0);
  const lastHoverValueRef = useRef<number>(0);
  
  const debouncedCursorMove = useRef(
    debounce((ev: ChartClickEventType, refs: ChartRefs) => {
      const { series, seriesHover, xAxis, yAxis } = refs;


      const posX = ev.target.getPrivate("positionX") ?? 0;
      const posY = ev.target.getPrivate("positionY") ?? 0;
      const x = xAxis.toAxisPosition(posX);
      const y = yAxis.toAxisPosition(posY);
      const item = xAxis.getSeriesItem(seriesHover, x);
      
      if (!item?.dataContext) return;
      
      const dataIndex = (item.dataContext as CategoryData).index;
      const yMax = yAxis.get("max", 10);
      const oldVal = (item.dataContext as CategoryData).value;
      const newVal = Math.min(Math.ceil(y * yMax), yMax);

      if (lastHoverDataIndexRef.current !== dataIndex) {
        const currentData = seriesHover.data.getIndex(Number(lastHoverDataIndexRef.current)) || { value: 0 };
        seriesHover.data.setIndex(~~lastHoverDataIndexRef.current, {
          ...currentData,
          value: 0
        });
        series.columns.getIndex(lastHoverDataIndexRef.current)?.set("opacity", 0.8);
        series.columns.getIndex(dataIndex)?.set("opacity", 0.3);
        lastHoverDataIndexRef.current = dataIndex;
      }

      if (oldVal === newVal) return;
      
      const currentData = seriesHover.data.getIndex(Number(lastHoverDataIndexRef.current)) || { value: 0 };
      seriesHover.data.setIndex(~~lastHoverDataIndexRef.current, {
        ...currentData,
        value: newVal
      });
      lastHoverValueRef.current = newVal;
    }, 16)
  ).current;

  const handleCursorMove = useCallback((ev: ChartClickEventType) => {
    if (!chartRefs.current) return;
    debouncedCursorMove(ev, chartRefs.current);
  }, [chartRefs, debouncedCursorMove]);

  const handleGlobalPointerMove = useCallback((ev: ChartClickEventType) => {
    if (!chartRefs.current) return;
    const { series, seriesHover, yAxis } = chartRefs.current;

    const x = ev.point.x;
    const y = ev.point.y;
    const chart = series.chart;
    if (!chart) return;
    const chartCenterX = chart.width() / 2;
    const chartCenterY = chart.height() / 2;
    const distance = Math.sqrt(
      Math.pow(x - chartCenterX, 2) + Math.pow(y - chartCenterY, 2)
    );
    const maxRadius = yAxis.maxHeight();

    if (distance > maxRadius * 1.1) {
      const currentData = seriesHover.data.getIndex(Number(lastHoverDataIndexRef.current)) || { value: 0 };
      seriesHover.data.setIndex(~~lastHoverDataIndexRef.current, {
        ...currentData,
        value: 0
      });
      series.columns.getIndex(lastHoverDataIndexRef.current)?.set("opacity", 0.8);
    }

  }, [chartRefs]);

  const handleChartClick = useCallback(() => {
    if (!chartRefs.current) return;
    const { series } = chartRefs.current;

    const currentData = series.data.getIndex(Number(lastHoverDataIndexRef.current)) || { value: 0 };
    series.data.setIndex(lastHoverDataIndexRef.current, {
      ...currentData,
      value: lastHoverValueRef.current
    });
  }, [chartRefs]);


  return {
    handleCursorMove,
    handleGlobalPointerMove,
    handleChartClick
  };
};

const useChartSetup = (chartDiv: HTMLDivElement | null) => {
  const chartRef = useRef<am5.Root | null>(null);
  const exportingRef = useRef<am5exporting.Exporting | null>(null);
  const chartRefsRef = useRef<ChartRefs | null>(null);
  //const lastHoverDataIndexRef = useRef<number>(0);
  //const lastHoverValueRef = useRef<number>(0);
  const { handleCursorMove, handleGlobalPointerMove, 
    handleChartClick } = useChartHandlers(chartRefsRef);



  useLayoutEffect(() => {
    if (!chartDiv) return;

    const root = am5.Root.new(chartDiv);
    chartRef.current = root;

    root.setThemes([
      am5themes_Animated.new(root),
      am5themes_Material.new(root)
    ]);

    const chart = root.container.children.push(
      am5radar.RadarChart.new(root, {
        panX: false,
        panY: false,
        //wheelX: "none",
        //wheelY: "none",
        //maxZoomLevel: 1,
        //pinchZoomX: false,
        //pinchZoomY: false
      })
    );

    exportingRef.current = am5exporting.Exporting.new(root, {
      backgroundColor: am5.color('#ffffff')
    });

    // Axes setup
    const xRenderer = am5radar.AxisRendererCircular.new(root, {});
    xRenderer.labels.template.setAll({
      radius: 10,
    });
    xRenderer.labels.template.adapters.add("text", (_val, target) => {
      const width = target.root.width() ?? 600;
      if (width < 540){
        return "{categoryShort}";
      }
      return"{category}";
    })


    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        maxDeviation: 0,
        categoryField: "category",
        renderer: xRenderer,
        tooltip: am5.Tooltip.new(root, { forceHidden: true })
      })
    );

    const yRenderer = am5radar.AxisRendererRadial.new(root, {
      minGridDistance: 20
    });

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        min: 0,
        max: 10,
        renderer: yRenderer
      })
    );

    yAxis.get("renderer").labels.template.set("forceHidden", true);

    // Series setup
    const series = chart.series.push(
      am5radar.RadarColumnSeries.new(root, {
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "value",
        categoryXField: "category",
        opacity: 0.8
      })
    );

    const seriesHover = chart.series.push(
      am5radar.RadarColumnSeries.new(root, {
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "value",
        categoryXField: "category",
        opacity: 0.5
      })
    );

    root.numberFormatter.set("numberFormat", "##.");
    series.columns.template.setAll({
      tooltipText: "{categoryX}: {valueY}",
      templateField: "columnSettings",
      strokeOpacity: 0,
      width: am5.percent(100)
    });
    seriesHover.columns.template.setAll({
      templateField: "columnSettings",
      strokeOpacity: 0,
      width: am5.percent(100)
    });


    // Initialize data
    series.data.setAll(INITIAL_DATA);
    seriesHover.data.setAll(INITIAL_DATA);
    xAxis.data.setAll(INITIAL_DATA);

    series.set("clustered", false);
    seriesHover.set("clustered", false);

    // Cursor setup
    const cursor = chart.set("cursor", am5radar.RadarCursor.new(root, {}));
    cursor.lineX.set("visible", false);
    cursor.lineY.set("visible", false);
    
    // Event handlers
    cursor.events.on("cursormoved", handleCursorMove);
    chart.events.on("globalpointermove", handleGlobalPointerMove);
    chart.events.on("click", handleChartClick);
    chartRefsRef.current = {
      series: series,
      seriesHover: seriesHover,
      xAxis: xAxis,
      yAxis: yAxis
    }
    return () => {
      root.dispose();
    };
  }, [chartDiv, handleChartClick, handleCursorMove, handleGlobalPointerMove ]);

  return exportingRef;
};

// Main Component
const LifeWheel = () => {
  const [chartDiv, setChartDiv] = useState<HTMLDivElement | null>(null);
  const [chartState, setChartState] = useState<ChartState>(INITIAL_CHART_STATE);
  const exportingRef = useChartSetup(chartDiv);

  useChartPerformance();

  const getExportedPng = useCallback(async () => {
    if (exportingRef.current) {
      try {
        const chartPngData = await exportingRef.current.export("png", {});
        const base64Data = chartPngData.replace(/^data:image\/png;base64,/, '');
        return base64ToBlob(base64Data);
      } catch (error) {
        console.log("Couldn't export chart image:", error);
      }
    }
    return null;
  }, [exportingRef]);

  const handleDownload = useCallback(async () => {
    if (chartState.downloadBtnDisabled) return;
    
    setChartState(prev => ({ ...prev, downloadBtnDisabled: true }));
    
    const blob = await getExportedPng();
    if (blob) {
      try {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'livshjulet.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Export failed:", error);
      }
    }
    
    await sleep(2000);
    setChartState(prev => ({ ...prev, downloadBtnDisabled: false }));
  }, [chartState.downloadBtnDisabled, getExportedPng]);

  const handleCopyToClipboard = useCallback(async () => {
    if (chartState.clipboardBtnState !== 0) return;
    
    setChartState(prev => ({ 
      ...prev, 
      clipboardBtnState: 1 
    }));
    
    const blob = await getExportedPng();
    let failed = true;
    if (blob) {
      try {
        const clipboardItem = new ClipboardItem({
          'image/png': blob
        });
        
        await navigator.clipboard.write([clipboardItem]);
        setChartState(prev => ({
          ...prev,
          clipboardBtnText: 'Kopiert!',
          clipboardBtnState: 2
        }));
        await sleep(2000);
        failed = false;
      } catch (error) {
        console.error("Clipboard copy failed:", error);
      }
    } 

    if (failed) {
      setChartState(prev => ({
        ...prev,
        clipboardBtnText: 'Kopiering feilet',
        clipboardBtnState: -1
      }));
      await sleep(2000);
    }
    setChartState(chartState);
  }, [chartState, getExportedPng]);


  return (
    <ErrorBoundary onErrorMsg='Det oppstod en feil under lasting av diagrammet.'>
      <div className="flex flex-col">
        <div className="w-full">
          <div className="flex md:flex-row-reverse flex-col-reverse items-center bg-gray-100 px-4 py-2 rounded-md min-h-20 gap-2">
            <Button 
              className="flex items-center w-fit gap-2"
              onClick={handleDownload}
              disabled={chartState.downloadBtnDisabled}
            >
              <Download className="w-5 h-5" />
              Last ned bilde
            </Button>
            <Button
              className='flex items-center gap-2 w-52'
              onClick={handleCopyToClipboard}
              disabled={chartState.clipboardBtnState !== 0}
            >
              {chartState.clipboardBtnState === 0 ? (
                <ClipboardCopy className="w-5 h-5 text-gray-500" />
              ) : chartState.clipboardBtnState === 1 ? (
                <CircleDashed className="w-5 h-5 text-gray-500" />
              ) : chartState.clipboardBtnState > 1 ? (
                <CircleCheck className="w-5 h-5 text-green-500" />
              ) : (
                <CircleX className="w-5 h-5 text-red-500" />
              )}
              {chartState.clipboardBtnText}
            </Button>
          </div>
        </div>
        <div 
          ref={setChartDiv} 
          className="flex-1 max-w grow aspect-square min-w[460px] md:max-h-screen"
        />
      </div>
    </ErrorBoundary>
  );
}

export default LifeWheel;