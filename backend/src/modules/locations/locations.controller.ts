import { Controller, Get, Query } from '@nestjs/common';
import { LocationsService } from './locations.service';

// Public — the registration wizard needs these before a session exists, and they're
// non-sensitive reference data (Rwanda's administrative divisions), so no auth guard.
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('provinces')
  provinces() {
    return this.locationsService.provinces();
  }

  @Get('districts')
  districts(@Query('province') province: string) {
    return this.locationsService.districts(province);
  }

  @Get('sectors')
  sectors(@Query('province') province: string, @Query('district') district: string) {
    return this.locationsService.sectors(province, district);
  }

  @Get('cells')
  cells(
    @Query('province') province: string,
    @Query('district') district: string,
    @Query('sector') sector: string,
  ) {
    return this.locationsService.cells(province, district, sector);
  }

  @Get('villages')
  villages(
    @Query('province') province: string,
    @Query('district') district: string,
    @Query('sector') sector: string,
    @Query('cell') cell: string,
  ) {
    return this.locationsService.villages(province, district, sector, cell);
  }
}
