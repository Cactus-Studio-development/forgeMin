import { Inject, Injectable } from '@nestjs/common';
import {
  ITerritoryDiscoveryService,
  TERRITORY_DISCOVERY_SERVICE,
  TerritorySearchFilter,
} from '../../../domain/ris3/repositories/territory-repository.interface';
import { TerritoryLead } from '../../../domain/ris3/entities/territory.entity';

@Injectable()
export class DiscoverZoneLeadsUseCase {
  constructor(
    @Inject(TERRITORY_DISCOVERY_SERVICE)
    private readonly discoveryService: ITerritoryDiscoveryService,
  ) {}

  async execute(filter: TerritorySearchFilter): Promise<TerritoryLead[]> {
    return this.discoveryService.searchByZone(filter);
  }
}
