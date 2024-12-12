import { useLayoutEffect, useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Download, ClipboardCopy, CircleX, CircleCheck, CircleDashed} from 'lucide-react';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy'
import * as am5radar from '@amcharts/amcharts5/radar';
import * as am5exporting from "@amcharts/amcharts5/plugins/exporting";
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import am5themes_Material from '@amcharts/amcharts5/themes/Material';

interface CategoryData {
  category: string;
  value: number;
  columnSettings: {
    fill: am5.Color;
    opacity: number;
  };
  index: number;
}

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

const LifeWheel = () => {
  const [chartDiv, setChartDiv] = useState<HTMLDivElement | null>(null);
  const [downloadBtnDisabled, setDownloadBtnDisabled] = useState<boolean>(false);
  const [clipboardBtnState, setclipboardBtnState] = useState<number>(0);
  const [clipboardBtnText, setClipboardBtnText] = useState<string>('Kopier til utklippstavle');
  const chartRef = useRef<am5.Root | null>(null);
  const exportingRef = useRef<am5exporting.Exporting | null>(null);

  const getExportedPng = async () => {
      if (exportingRef.current){
        try{
          const chartPngData = await exportingRef.current.export("png", {});
          const base64Data = chartPngData.replace(/^data:image\/png;base64,/, '');
          const blob = base64ToBlob(base64Data);
          return blob;
        } catch (error) {
          console.log("Couldn't export chart image:", error);
        }
      }
      else {
        console.log("Chart export not available.");
      }
      return null;
  }
  const handleDownload = async () => {
    if (downloadBtnDisabled) return;
    setDownloadBtnDisabled(true);
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
    setDownloadBtnDisabled(false);
  };

  const handleCopyToClipboard = async () => {
    if (clipboardBtnState != 0) return;
    setclipboardBtnState(1);
    const blob = await getExportedPng();
    if (blob) {
      try {
        const clipboardItem = new ClipboardItem({
          'image/png': blob
        });
        
        await navigator.clipboard.write([clipboardItem]);
        setClipboardBtnText('Kopiert!');
        setclipboardBtnState(2);
        await sleep(2000);
      } catch (error) {
        console.error("Clipboard copy failed:", error);
        setClipboardBtnText('Kopiering feilet');
        setclipboardBtnState(-1);
        await sleep(2000);
      }
    }
    else {
      setClipboardBtnText('Kopiering feilet');
      setclipboardBtnState(-1);
      await sleep(2000);
    }
    setClipboardBtnText('Kopier til utklippstavle');
    setclipboardBtnState(0);
  };

  useLayoutEffect(() => {
    if (!chartDiv) return;

    // Create root element
    const root = am5.Root.new(chartDiv);
    chartRef.current = root;

    // Set themes
    root.setThemes([
      am5themes_Animated.new(root),
      am5themes_Material.new(root)
    ]);

    // Create chart
    const chart = root.container.children.push(
      am5radar.RadarChart.new(root, {
        panX: false,
        panY: false
      })
    );

    // Add export menu
    exportingRef.current = am5exporting.Exporting.new(root, {
        //menu: am5exporting.ExportingMenu.new(root, {})
        backgroundColor: am5.color('#ffffff')
        //backgroundOpacity: 0
      });
    // Create color set
    const colorSet = am5.ColorSet.new(root, {
      colors: COLORS.map(color => am5.color(color)),
      reuse: true
    });

    // Create axes
    const xRenderer = am5radar.AxisRendererCircular.new(root, {});
    xRenderer.labels.template.setAll({
      radius: 10
    });

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

    // Create series
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

    // Create initial data
    const data: CategoryData[] = CATEGORIES.map((category, index) => ({
      category,
      value: 0,
      columnSettings: {
        fill: colorSet.next(),
        opacity: 0.8
      },
      index
    }));

    const dataHover = [...data];

    series.data.setAll(data);
    seriesHover.data.setAll(dataHover);
    xAxis.data.setAll(data);

    series.set("clustered", false);
    seriesHover.set("clustered", false);

    // Add cursor
    const cursor = chart.set("cursor", am5radar.RadarCursor.new(root, {}));
    cursor.lineX.set("visible", false);
    cursor.lineY.set("visible", false);

    let lastHoverDataIndex = 0;
    let lastHoverValue = 0;

    // Handle hover
    cursor.events.on("cursormoved", (ev) => {
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

      if (lastHoverDataIndex !== dataIndex) {
        const currentData = seriesHover.data.getIndex(Number(lastHoverDataIndex)) || { value: 0 };
        seriesHover.data.setIndex(~~lastHoverDataIndex, {
          ...currentData,
          value: 0
        });
        series.columns.getIndex(lastHoverDataIndex)?.set("opacity", 0.8);
        series.columns.getIndex(dataIndex)?.set("opacity", 0.3);
        lastHoverDataIndex = dataIndex;
      }

      if (oldVal === newVal) return;
      
      const currentData = seriesHover.data.getIndex(Number(lastHoverDataIndex)) || { value: 0 };
      seriesHover.data.setIndex(~~lastHoverDataIndex, {
        ...currentData,
        value: newVal
      });
      lastHoverValue = newVal;
    });

    // Handle mouse leaving chart area
    chart.events.on("globalpointermove", (ev) => {
      const x = ev.point.x;
      const y = ev.point.y;
      const chartCenterX = chart.width() / 2;
      const chartCenterY = chart.height() / 2;
      const distance = Math.sqrt(
        Math.pow(x - chartCenterX, 2) + Math.pow(y - chartCenterY, 2)
      );
      const maxRadius = yAxis.maxHeight();

      if (distance > maxRadius * 1.1) {
        const currentData = seriesHover.data.getIndex(Number(lastHoverDataIndex)) || { value: 0 };
        seriesHover.data.setIndex(~~lastHoverDataIndex, {
          ...currentData,
          value: 0
        });
        series.columns.getIndex(lastHoverDataIndex)?.set("opacity", 0.8);
      }
    });

    // Handle click
    chart.events.on("click", () => {
        const currentData = series.data.getIndex(Number(lastHoverDataIndex)) || { value: 0 };
            series.data.setIndex(lastHoverDataIndex, {
            ...currentData,
            value: lastHoverValue
        });
        console.log('click', currentData, lastHoverDataIndex);
    });

    // Cleanup
    return () => {
      root.dispose();
    };
  }, [chartDiv]);

  return (
    <div className="flex flex-col">
        <div className="w-full ">
            <div className="flex md:flex-row-reverse flex-col-reverse items-center bg-gray-100 px-4 py-2 rounded-md min-h-20 gap-2">
                <Button 
                    className="flex items-center w-fit gap-2"
                    onClick={handleDownload}
                    disabled={downloadBtnDisabled}
                >
                    <Download className="w-5 h-5" />
                    Last ned bilde
                </Button>
                <Button
                  className='flex items-center gap-2 w-52'
                  onClick={handleCopyToClipboard}
                  disabled={clipboardBtnState != 0}
                  >
                  {clipboardBtnState == 0 ? (
                    <ClipboardCopy className="w-5 h-5 text-gray-500" />
                  ) : clipboardBtnState == 1 ? (
                    <CircleDashed className="w-5 h-5 text-gray-500" />
                  ) : clipboardBtnState > 1 ? (
                    <CircleCheck className="w-5 h-5 text-green-500" />
                  ) : (
                    <CircleX className="w-5 h-5 text-red-500" />
                  )}
                    {clipboardBtnText}
                  </Button>
            </div>
        </div>
        <div 
            ref={setChartDiv} 
            className="flex-1 max-w grow aspect-square min-w[460px] md:max-h-screen " 
        />
    </div>
  );
};

export default LifeWheel;