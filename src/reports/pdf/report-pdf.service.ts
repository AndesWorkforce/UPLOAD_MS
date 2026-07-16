import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { Browser } from 'puppeteer';

/**
 * Servicio optimizado para generar PDFs usando Puppeteer
 * Reutiliza instancia de browser para mejor performance
 */
@Injectable()
export class ReportPdfService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReportPdfService.name);
  private browser: Browser | null = null;
  private readonly PDF_TIMEOUT_MS = 30000; // 30 segundos

  async onModuleInit() {
    await this.initBrowser();
  }

  async onModuleDestroy() {
    await this.closeBrowser();
  }

  /**
   * Genera PDF desde HTML
   * @param html Contenido HTML para renderizar
   * @returns Buffer del PDF generado
   */
  async generatePdf(html: string): Promise<Buffer> {
    const browser = await this.ensureBrowser();

    const page = await browser.newPage();

    try {
      // Establecer timeout para evitar cuelgues
      page.setDefaultTimeout(this.PDF_TIMEOUT_MS);

      // Viewport A4 (~794px a 96dpi) para que Chart.js respete el ancho del PDF
      await page.setViewport({
        width: 794,
        height: 1123,
        deviceScaleFactor: 1,
      });

      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: this.PDF_TIMEOUT_MS,
      });

      // Esperar a que Chart.js termine de renderizar los canvas
      await page.evaluate(async () => {
        await new Promise((resolve) => setTimeout(resolve, 300));
      });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm',
        },
        timeout: this.PDF_TIMEOUT_MS,
      });

      return pdfBuffer;
    } finally {
      await page.close().catch((err) => {
        this.logger.warn('Error closing page', err);
      });
    }
  }

  /**
   * Inicializa browser de Puppeteer
   */
  private async initBrowser(): Promise<void> {
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      });
      this.logger.log('Puppeteer browser initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Puppeteer browser', error);
      throw error;
    }
  }

  /**
   * Asegura que el browser esté activo
   */
  private async ensureBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      this.logger.warn('Browser disconnected, reinitializing...');
      await this.initBrowser();
    }

    if (!this.browser) {
      throw new Error('Failed to initialize browser');
    }

    return this.browser;
  }

  /**
   * Cierra browser de forma segura
   */
  private async closeBrowser(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
        this.logger.log('Puppeteer browser closed');
      } catch (error) {
        this.logger.error('Error closing browser', error);
      } finally {
        this.browser = null;
      }
    }
  }
}
