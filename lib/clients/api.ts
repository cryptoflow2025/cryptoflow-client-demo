import axios from 'axios';
import { apiConfig } from '../../config/api';

const api = axios.create({
  baseURL: apiConfig.baseURL,
});

export const projectService = {
  async getDistributionInfo(projectId: string) {
    const distribution = await api.get(`/common/distribution_info/${projectId}`);
    return distribution.data;
  }
}